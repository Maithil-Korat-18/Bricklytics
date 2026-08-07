"""Fixed-value amenity configuration for the standalone model package.

Amenities are not present in the training data and must never be model
features.  Keep monetary values here (rather than scattered percentages) so
they are reviewable and configurable.
"""
from backend.seller.services.facility_adjustment_service import AMENITY_FIXED_VALUES_INR


def amenity_adjustment_inr(selected_amenities: list[str] | None) -> float:
    selected = {str(a).strip() for a in (selected_amenities or [])}
    return round(sum(AMENITY_FIXED_VALUES_INR.get(a, 0.0) for a in selected), 2)


def amenity_score_0_100(selected_amenities: list[str] | None) -> float:
    maximum = sum(AMENITY_FIXED_VALUES_INR.values())
    return round(100 * amenity_adjustment_inr(selected_amenities) / maximum, 1) if maximum else 0.0
