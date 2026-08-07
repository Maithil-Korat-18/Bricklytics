"""Configurable, fixed-value amenity adjustments.

Amenities are deliberately outside the regression feature set.  These values
are a single configuration point so product/market teams can revise them
without changing prediction logic.
"""

from typing import Any, Dict, Iterable


# Amounts are in INR and apply once per distinct selected amenity.
AMENITY_FIXED_VALUES_INR: Dict[str, float] = {
    'Parking': 250_000, 'Private Parking': 300_000, 'Visitor Parking': 75_000,
    'Lift': 125_000, 'Gym': 175_000, 'Swimming Pool': 300_000,
    'Clubhouse': 250_000, 'Power Backup': 100_000, 'Security': 150_000,
    'CCTV': 75_000, 'Garden': 125_000, 'Children Play Area': 100_000,
    'Children Park': 100_000, 'Jogging Track': 75_000, 'Indoor Games': 60_000,
    'Intercom': 40_000, 'Fire Safety': 80_000, 'Terrace': 120_000,
    'Private Lawn': 200_000, 'Solar Power': 175_000,
    'Rain Water Harvesting': 80_000, 'Community Temple': 30_000,
}


class FacilityAdjustmentEngine:
    """Apply transparent rule-based amenity values to an ML base price."""

    @staticmethod
    def calculate_adjustment(base_ml_price: float, selected_amenities: Iterable[str] | None) -> Dict[str, Any]:
        selected = {str(item).strip() for item in (selected_amenities or []) if str(item).strip()}
        base_price = float(base_ml_price or 0.0)

        breakdown = [
            {'name': amenity, 'added_value': AMENITY_FIXED_VALUES_INR[amenity]}
            for amenity in sorted(selected)
            if amenity in AMENITY_FIXED_VALUES_INR
        ]
        adjustment = round(sum(item['added_value'] for item in breakdown), 2)
        final_suggested_price = round(base_price + adjustment, 2)

        return {
            'facility_adjustment_amount': adjustment,
            'facility_adjustment_percent': round((adjustment / base_price * 100.0), 2) if base_price > 0 else 0.0,
            'breakdown': breakdown,
            'final_suggested_price': final_suggested_price,
        }


