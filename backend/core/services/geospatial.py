"""
Location Intelligence fetchers.

Responsible for pulling raw points-of-interest (schools, hospitals,
stations, etc.) around a Property from an external provider, persisting
them as Amenity rows, and linking them to the property with a computed
distance. This module deliberately knows nothing about scoring/weights --
it only answers "what's nearby and how far is it."

Two providers are supported:
  - Overpass API (OpenStreetMap): free, keyless, good global coverage,
    occasionally rate-limited / stale in rural areas.
  - Google Places API: paid, very fresh/accurate, better for dense
    metro areas and business-status data (open/closed).

Provider is chosen via settings.AMENITY_PROVIDER.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable

import requests
from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from django.utils import timezone

from core.models import (
    Amenity,
    AmenitySubtype,
    Property,
    PropertyAmenityLink,
    SUBTYPE_TO_CATEGORY,
)

logger = logging.getLogger(__name__)

# Overpass tag filters for each amenity subtype we care about.
# Format: (osm_key, osm_value)
OVERPASS_TAGS = {
    AmenitySubtype.SCHOOL: ("amenity", "school"),
    AmenitySubtype.COLLEGE: ("amenity", "college"),
    AmenitySubtype.DAYCARE: ("amenity", "kindergarten"),
    AmenitySubtype.FIRE_STATION: ("amenity", "fire_station"),
    AmenitySubtype.POLICE_STATION: ("amenity", "police"),
    AmenitySubtype.HOSPITAL: ("amenity", "hospital"),
    AmenitySubtype.PHARMACY: ("amenity", "pharmacy"),
    AmenitySubtype.URGENT_CARE: ("amenity", "clinic"),
    AmenitySubtype.SUBWAY: ("railway", "station"),
    AmenitySubtype.BUS_STOP: ("highway", "bus_stop"),
    AmenitySubtype.TRAIN: ("railway", "halt"),
}

# Google Places "type" equivalent, used only if AMENITY_PROVIDER == "google"
GOOGLE_PLACE_TYPES = {
    AmenitySubtype.SCHOOL: "school",
    AmenitySubtype.COLLEGE: "university",
    AmenitySubtype.DAYCARE: "child_care",
    AmenitySubtype.FIRE_STATION: "fire_station",
    AmenitySubtype.POLICE_STATION: "police",
    AmenitySubtype.HOSPITAL: "hospital",
    AmenitySubtype.PHARMACY: "pharmacy",
    AmenitySubtype.URGENT_CARE: "doctor",
    AmenitySubtype.SUBWAY: "subway_station",
    AmenitySubtype.BUS_STOP: "bus_station",
    AmenitySubtype.TRAIN: "train_station",
}


@dataclass
class RawPOI:
    source: str
    source_id: str
    name: str
    subtype: str
    lon: float
    lat: float
    raw_tags: dict


class OverpassClient:
    """Thin wrapper around the Overpass API. Builds one query per subtype
    (rather than one giant query) so a slow/failing category doesn't
    block the others, and so results can be cached independently."""

    def __init__(self, base_url: str | None = None, timeout: int = 25):
        self.base_url = base_url or settings.OVERPASS_API_URL
        self.timeout = timeout

    def query_subtype(self, subtype: str, lat: float, lon: float, radius_m: int) -> list[RawPOI]:
        key, value = OVERPASS_TAGS[subtype]
        # `around` filter does a radius search server-side, so we never
        # pull more data than we need.
        ql = f"""
        [out:json][timeout:{self.timeout}];
        (
          node["{key}"="{value}"](around:{radius_m},{lat},{lon});
          way["{key}"="{value}"](around:{radius_m},{lat},{lon});
        );
        out center;
        """
        try:
            resp = requests.post(self.base_url, data={"data": ql}, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException:
            logger.exception("Overpass query failed for subtype=%s", subtype)
            return []

        elements = resp.json().get("elements", [])
        pois = []
        for el in elements:
            center = el.get("center") or {"lat": el.get("lat"), "lon": el.get("lon")}
            if center.get("lat") is None:
                continue
            tags = el.get("tags", {})
            pois.append(RawPOI(
                source="overpass",
                source_id=f"{el['type']}/{el['id']}",
                name=tags.get("name", ""),
                subtype=subtype,
                lon=center["lon"],
                lat=center["lat"],
                raw_tags=tags,
            ))
        return pois


class GooglePlacesClient:
    """Optional paid alternative to Overpass. Uses Nearby Search."""

    BASE_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    def __init__(self, api_key: str | None = None, timeout: int = 15):
        self.api_key = api_key or settings.GOOGLE_PLACES_API_KEY
        self.timeout = timeout

    def query_subtype(self, subtype: str, lat: float, lon: float, radius_m: int) -> list[RawPOI]:
        if not self.api_key:
            logger.warning("GOOGLE_PLACES_API_KEY not set; skipping subtype=%s", subtype)
            return []
        place_type = GOOGLE_PLACE_TYPES[subtype]
        params = {
            "location": f"{lat},{lon}",
            "radius": radius_m,
            "type": place_type,
            "key": self.api_key,
        }
        try:
            resp = requests.get(self.BASE_URL, params=params, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException:
            logger.exception("Google Places query failed for subtype=%s", subtype)
            return []

        data = resp.json()
        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            logger.error("Google Places error status=%s for subtype=%s", data.get("status"), subtype)
            return []

        pois = []
        for result in data.get("results", []):
            loc = result["geometry"]["location"]
            pois.append(RawPOI(
                source="google_places",
                source_id=result["place_id"],
                name=result.get("name", ""),
                subtype=subtype,
                lon=loc["lng"],
                lat=loc["lat"],
                raw_tags={"rating": result.get("rating"), "business_status": result.get("business_status")},
            ))
        return pois


def get_amenity_client():
    if settings.AMENITY_PROVIDER == "google":
        return GooglePlacesClient()
    return OverpassClient()


def refresh_amenities_for_property(prop: Property, radius_m: int, subtypes: Iterable[str] | None = None) -> int:
    """Fetch nearby POIs for `prop` across all (or a subset of) amenity
    subtypes, upsert them as Amenity rows, and (re)link them to `prop`
    with a computed straight-line distance. Returns count of links written.

    Respects settings.AMENITY_CACHE_TTL_HOURS -- if a link for a subtype's
    category was computed recently enough, that subtype is skipped unless
    forced via `subtypes`.
    """
    client = get_amenity_client()
    subtypes = list(subtypes) if subtypes else list(OVERPASS_TAGS.keys())
    lat, lon = prop.location.y, prop.location.x

    cutoff = timezone.now() - timedelta(hours=settings.AMENITY_CACHE_TTL_HOURS)
    written = 0

    for subtype in subtypes:
        already_fresh = PropertyAmenityLink.objects.filter(
            property=prop, amenity__subtype=subtype, computed_at__gte=cutoff,
        ).exists()
        if already_fresh:
            continue

        pois = client.query_subtype(subtype, lat, lon, radius_m)
        for poi in pois:
            amenity, _ = Amenity.objects.update_or_create(
                source=poi.source,
                source_id=poi.source_id,
                defaults=dict(
                    name=poi.name,
                    subtype=poi.subtype,
                    category=SUBTYPE_TO_CATEGORY.get(poi.subtype, ""),
                    location=Point(poi.lon, poi.lat, srid=4326),
                    raw_tags=poi.raw_tags,
                ),
            )
            distance_m = prop.location.distance(amenity.location) * 100_000  # deg->m approx fallback
            # Prefer a proper geodesic distance via PostGIS if available.
            qs = Property.objects.filter(pk=prop.pk).annotate(
                dist=Distance("location", amenity.location)
            )
            annotated = qs.first()
            if annotated is not None and annotated.dist is not None:
                distance_m = annotated.dist.m

            PropertyAmenityLink.objects.update_or_create(
                property=prop, amenity=amenity,
                defaults={"distance_meters": distance_m},
            )
            written += 1

    return written


def nearest_amenity_distance(prop: Property, category: str) -> float | None:
    """Return the distance (meters) to the closest amenity in `category`
    already linked to this property, or None if nothing's been fetched."""
    link = (
        PropertyAmenityLink.objects
        .filter(property=prop, amenity__category=category)
        .order_by("distance_meters")
        .first()
    )
    return link.distance_meters if link else None
