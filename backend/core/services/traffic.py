"""
Traffic & Congestion Analysis.

Wraps TomTom's Flow Segment Data API and HERE's Traffic Flow API behind
one interface so the scoring engine doesn't care which provider is
configured. Both APIs return, for the road segment nearest a coordinate,
the current speed vs. the free-flow speed -- from that we derive a
0..1 congestion_index (0 = free flow, 1 = gridlock).
"""
from __future__ import annotations

import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone

from core.models import Property, TrafficSnapshot

logger = logging.getLogger(__name__)


class TomTomTrafficClient:
    FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

    def __init__(self, api_key: str | None = None, timeout: int = 10):
        self.api_key = api_key or settings.TOMTOM_API_KEY
        self.timeout = timeout

    def fetch(self, lat: float, lon: float) -> dict | None:
        if not self.api_key:
            logger.warning("TOMTOM_API_KEY not set; cannot fetch traffic data")
            return None
        params = {"point": f"{lat},{lon}", "key": self.api_key}
        try:
            resp = requests.get(self.FLOW_URL, params=params, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException:
            logger.exception("TomTom flow request failed")
            return None

        data = resp.json().get("flowSegmentData", {})
        current = data.get("currentSpeed")
        free_flow = data.get("freeFlowSpeed")
        if not current or not free_flow:
            return None

        congestion_index = max(0.0, min(1.0, 1 - (current / free_flow)))
        return {
            "congestion_index": congestion_index,
            "current_speed_kph": current,
            "free_flow_speed_kph": free_flow,
            "avg_commute_seconds_peak": data.get("currentTravelTime"),
        }


class HereTrafficClient:
    FLOW_URL = "https://data.traffic.hereapi.com/v7/flow"

    def __init__(self, api_key: str | None = None, timeout: int = 10):
        self.api_key = api_key or settings.HERE_API_KEY
        self.timeout = timeout

    def fetch(self, lat: float, lon: float) -> dict | None:
        if not self.api_key:
            logger.warning("HERE_API_KEY not set; cannot fetch traffic data")
            return None
        params = {
            "locationReferencing": "shape",
            "in": f"circle:{lat},{lon};r=200",
            "apiKey": self.api_key,
        }
        try:
            resp = requests.get(self.FLOW_URL, params=params, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException:
            logger.exception("HERE flow request failed")
            return None

        results = resp.json().get("results", [])
        if not results:
            return None
        flow = results[0].get("currentFlow", {})
        current = flow.get("speed")
        free_flow = flow.get("freeFlow")
        if not current or not free_flow:
            return None

        congestion_index = max(0.0, min(1.0, 1 - (current / free_flow)))
        return {
            "congestion_index": congestion_index,
            "current_speed_kph": current * 3.6,   # HERE returns m/s
            "free_flow_speed_kph": free_flow * 3.6,
            "avg_commute_seconds_peak": None,
        }


def get_traffic_client():
    if settings.TRAFFIC_PROVIDER == "here":
        return HereTrafficClient()
    return TomTomTrafficClient()


def refresh_traffic_for_property(prop: Property, force: bool = False) -> TrafficSnapshot | None:
    """Return a fresh-enough TrafficSnapshot, fetching from the live
    provider only if the cached one has expired (traffic changes fast,
    so this cache window is short -- see TRAFFIC_CACHE_TTL_MINUTES)."""
    cutoff = timezone.now() - timedelta(minutes=settings.TRAFFIC_CACHE_TTL_MINUTES)
    if not force:
        recent = (
            prop.traffic_snapshots
            .filter(captured_at__gte=cutoff)
            .order_by("-captured_at")
            .first()
        )
        if recent:
            return recent

    client = get_traffic_client()
    lat, lon = prop.location.y, prop.location.x
    result = client.fetch(lat, lon)
    if result is None:
        # Fall back to the last known snapshot rather than returning
        # nothing -- stale traffic data beats no traffic data for scoring.
        return prop.traffic_snapshots.order_by("-captured_at").first()

    return TrafficSnapshot.objects.create(
        property=prop,
        provider=settings.TRAFFIC_PROVIDER,
        congestion_index=result["congestion_index"],
        avg_commute_seconds_peak=result.get("avg_commute_seconds_peak"),
        current_speed_kph=result.get("current_speed_kph"),
        free_flow_speed_kph=result.get("free_flow_speed_kph"),
    )
