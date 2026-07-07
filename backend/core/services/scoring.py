"""
The Priority-Based Analysis Engine.

Turns raw, differently-scaled signals (meters to nearest school, a 0..1
congestion index, etc.) into one comparable 0-100 Match Score per
property, personalized by a UserPreferenceProfile's category weights.

Design choices worth knowing about when you extend this:

1. Normalization uses an exponential decay curve, not a hard cutoff.
   A school 400m away and one 450m away should score almost the same;
   a linear "0-1km maps to 100-0" scale makes that boundary too sharp.
   decay(x) = 100 * exp(-x / half_life) gives smooth falloff, and
   half_life is tuned per category (a hospital 3km away still matters;
   a bus stop 3km away basically doesn't).

2. Aggregation is a weighted arithmetic mean by default, with an
   optional weighted geometric mean ("strict" mode) that heavily
   penalizes any single high-weight category scoring near zero --
   useful for a user who says "safety is non-negotiable" rather than
   "safety matters somewhat more than other things."

3. Every function returns the breakdown, not just the final number --
   the API layer persists this so the frontend can show *why* a
   property scored the way it did (transparency matters more for a
   ranking algorithm than raw accuracy).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from core.models import AmenityCategory, MatchScore, Property, UserPreferenceProfile
from core.services.geospatial import nearest_amenity_distance
from core.services.traffic import refresh_traffic_for_property

# Distance (meters) at which a category's normalized score has decayed to
# ~37% (1/e). Tuned per category based on realistic "still matters" ranges.
CATEGORY_HALF_LIFE_M = {
    AmenityCategory.EDUCATION: 1200,
    AmenityCategory.SAFETY: 2500,     # response time matters even from farther away
    AmenityCategory.HEALTHCARE: 2000,
    AmenityCategory.MOBILITY: 800,    # transit convenience drops off fast
}

MAX_CATEGORY_SCORE = 100.0


@dataclass
class CategoryResult:
    raw_value: float | None            # meters, or congestion_index for traffic
    normalized_score: float             # 0-100
    weight: int                         # 0-5
    contribution: float                 # normalized_score * weight, pre-sum


@dataclass
class MatchResult:
    property_id: int
    total_score: float
    breakdown: dict[str, CategoryResult] = field(default_factory=dict)


def _distance_decay_score(distance_m: float | None, half_life_m: float) -> float:
    """Exponential decay: closer = higher score, asymptotically approaching
    0 as distance grows. Missing data (no amenity found in radius) scores 0
    rather than being excluded, since 'nothing nearby' is a real signal."""
    if distance_m is None:
        return 0.0
    return MAX_CATEGORY_SCORE * math.exp(-distance_m / half_life_m)


def _traffic_score(congestion_index: float | None) -> float:
    """Traffic is inverted: low congestion = high score. If no traffic
    data is available we score it neutrally (50) rather than 0, since
    missing traffic data isn't evidence the area is bad."""
    if congestion_index is None:
        return 50.0
    return MAX_CATEGORY_SCORE * (1 - congestion_index)


def compute_match_score(
    prop: Property,
    profile: UserPreferenceProfile,
    strict: bool = False,
) -> MatchResult:
    """Compute (and persist) the match score for one property against one
    user's preference profile.

    Assumes `refresh_amenities_for_property` has already been run for this
    property/radius combination -- this function only *reads* cached
    PropertyAmenityLink / TrafficSnapshot rows, it doesn't fetch.
    """
    weights = profile.as_weight_dict()
    breakdown: dict[str, CategoryResult] = {}

    for category, half_life in CATEGORY_HALF_LIFE_M.items():
        weight = weights[category]
        distance = nearest_amenity_distance(prop, category)
        score = _distance_decay_score(distance, half_life)
        breakdown[category] = CategoryResult(
            raw_value=distance, normalized_score=score, weight=weight,
            contribution=score * weight,
        )

    traffic_weight = weights[AmenityCategory.TRAFFIC]
    snapshot = refresh_traffic_for_property(prop)
    congestion = snapshot.congestion_index if snapshot else None
    traffic_score = _traffic_score(congestion)
    breakdown[AmenityCategory.TRAFFIC] = CategoryResult(
        raw_value=congestion, normalized_score=traffic_score, weight=traffic_weight,
        contribution=traffic_score * traffic_weight,
    )

    total_weight = sum(r.weight for r in breakdown.values())
    if total_weight == 0:
        # User zeroed out every category -- fall back to an unweighted
        # average so the property still gets a sane, comparable score.
        total_score = sum(r.normalized_score for r in breakdown.values()) / len(breakdown)
    elif strict:
        # Weighted geometric mean: one badly-scoring "critical" category
        # drags the total down much harder than a weighted average would.
        log_sum = sum(r.weight * math.log(max(r.normalized_score, 1e-6)) for r in breakdown.values())
        total_score = math.exp(log_sum / total_weight)
    else:
        total_score = sum(r.contribution for r in breakdown.values()) / total_weight

    total_score = round(min(100.0, max(0.0, total_score)), 2)

    MatchScore.objects.update_or_create(
        property=prop, profile=profile,
        defaults={
            "total_score": total_score,
            "category_breakdown": {
                cat: {
                    "raw_value": r.raw_value,
                    "normalized_score": round(r.normalized_score, 2),
                    "weight": r.weight,
                    "contribution": round(r.contribution, 2),
                }
                for cat, r in breakdown.items()
            },
        },
    )

    return MatchResult(property_id=prop.id, total_score=total_score, breakdown=breakdown)


def rank_properties(
    properties: list[Property],
    profile: UserPreferenceProfile,
    strict: bool = False,
) -> list[MatchResult]:
    """Score every property against `profile` and return them sorted
    highest-to-lowest match score."""
    results = [compute_match_score(p, profile, strict=strict) for p in properties]
    return sorted(results, key=lambda r: r.total_score, reverse=True)
