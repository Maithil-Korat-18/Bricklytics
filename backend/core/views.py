from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Property, PropertyAmenityLink, UserPreferenceProfile
from core.serializers import (
    PropertyAmenityLinkSerializer,
    PropertySerializer,
    TrafficSnapshotSerializer,
    UserPreferenceProfileSerializer,
    MatchScoreSerializer,
)
from core.services.geospatial import refresh_amenities_for_property
from core.services.traffic import refresh_traffic_for_property
from core.services.scoring import compute_match_score, rank_properties


class PropertyViewSet(viewsets.ModelViewSet):
    """Standard CRUD for listings, plus a `nearby` filter and an
    `amenities` sub-resource used by the map/detail view."""

    queryset = Property.objects.filter(is_active=True)
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        lat = self.request.query_params.get("lat")
        lon = self.request.query_params.get("lon")
        radius_km = self.request.query_params.get("radius_km")
        if lat and lon:
            point = Point(float(lon), float(lat), srid=4326)
            qs = qs.annotate(distance=Distance("location", point))
            if radius_km:
                qs = qs.filter(location__distance_lte=(point, D(km=float(radius_km))))
            qs = qs.order_by("distance")
        return qs

    @action(detail=True, methods=["get"])
    def amenities(self, request, pk=None):
        """Return the cached amenity links for a property, grouped
        implicitly by category via the `category` filter param."""
        prop = self.get_object()
        links = PropertyAmenityLink.objects.filter(property=prop).select_related("amenity")
        category = request.query_params.get("category")
        if category:
            links = links.filter(amenity__category=category)
        links = links.order_by("distance_meters")
        return Response(PropertyAmenityLinkSerializer(links, many=True).data)

    @action(detail=True, methods=["post"])
    def refresh_amenities(self, request, pk=None):
        """Trigger a (re)fetch of nearby amenities for this property.
        Synchronous here for simplicity -- in production this should be
        dispatched to a Celery task (see core/tasks.py) since Overpass/
        Google calls can take a few seconds across 11 subtypes."""
        prop = self.get_object()
        radius_m = int(request.data.get("radius_meters", 2000))
        count = refresh_amenities_for_property(prop, radius_m=radius_m)
        return Response({"links_written": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def traffic(self, request, pk=None):
        prop = self.get_object()
        force = request.query_params.get("force") == "true"
        snapshot = refresh_traffic_for_property(prop, force=force)
        if snapshot is None:
            return Response({"detail": "No traffic data available for this location."},
                             status=status.HTTP_404_NOT_FOUND)
        return Response(TrafficSnapshotSerializer(snapshot).data)


class UserPreferenceProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserPreferenceProfileSerializer

    def get_queryset(self):
        return UserPreferenceProfile.objects.filter(user=self.request.user)


class MatchScoreView(APIView):
    """POST /properties/{id}/match-score/?profile_id=...
    Computes (and caches) the personalized match score for one property.
    """
    throttle_scope = "match_score"

    def get(self, request, property_id):
        profile_id = request.query_params.get("profile_id")
        strict = request.query_params.get("strict") == "true"
        prop = Property.objects.get(pk=property_id)
        profile = UserPreferenceProfile.objects.get(pk=profile_id, user=request.user)

        # Ensure we have amenity/traffic data before scoring; cheap no-op
        # if the cache (AMENITY_CACHE_TTL_HOURS / TRAFFIC_CACHE_TTL_MINUTES)
        # is still fresh.
        refresh_amenities_for_property(prop, radius_m=profile.search_radius_meters)
        result = compute_match_score(prop, profile, strict=strict)

        return Response({
            "property_id": result.property_id,
            "total_score": result.total_score,
            "breakdown": {
                cat: {
                    "raw_value": r.raw_value,
                    "normalized_score": round(r.normalized_score, 2),
                    "weight": r.weight,
                    "contribution": round(r.contribution, 2),
                } for cat, r in result.breakdown.items()
            },
        })


class RankedPropertiesView(APIView):
    """GET /properties/ranked/?profile_id=...&lat=...&lon=...&radius_km=...
    Returns every active property within radius_km of (lat, lon), sorted
    by personalized match score -- the main "search results" endpoint.
    """
    throttle_scope = "match_score"

    def get(self, request):
        profile_id = request.query_params.get("profile_id")
        lat = float(request.query_params["lat"])
        lon = float(request.query_params["lon"])
        radius_km = float(request.query_params.get("radius_km", 5))
        strict = request.query_params.get("strict") == "true"

        profile = UserPreferenceProfile.objects.get(pk=profile_id, user=request.user)
        point = Point(lon, lat, srid=4326)
        properties = list(
            Property.objects.filter(is_active=True)
            .filter(location__distance_lte=(point, D(km=radius_km)))
        )

        for prop in properties:
            refresh_amenities_for_property(prop, radius_m=profile.search_radius_meters)

        ranked = rank_properties(properties, profile, strict=strict)
        props_by_id = {p.id: p for p in properties}

        return Response([
            {
                "property": PropertySerializer(props_by_id[r.property_id]).data,
                "total_score": r.total_score,
                "breakdown": {
                    cat: {
                        "normalized_score": round(res.normalized_score, 2),
                        "weight": res.weight,
                    } for cat, res in r.breakdown.items()
                },
            }
            for r in ranked
        ])
