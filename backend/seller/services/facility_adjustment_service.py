"""
seller/services/facility_adjustment_service.py — Backend Facility Adjustment Engine
==================================================================================
Stores configurable amenity weights and calculates monetary & percentage adjustments 
on top of the Base ML Property Price.
"""

from typing import List, Dict, Any

# Configurable facility adjustment percentages
FACILITY_WEIGHTS: Dict[str, float] = {
    # General / Apartment Facilities
    'Parking': 2.5,
    'Lift': 2.0,
    'Gym': 2.0,
    'Swimming Pool': 3.5,
    'Clubhouse': 2.5,
    'Power Backup': 1.5,
    'Security': 1.5,
    'CCTV': 1.0,
    'Garden': 2.0,
    'Children Play Area': 1.5,
    'Children Park': 1.5,
    'Jogging Track': 1.0,
    'Indoor Games': 1.0,
    'Visitor Parking': 1.0,
    'Intercom': 1.0,
    'Fire Safety': 1.5,
    
    # Villa / House Specific Facilities
    'Terrace': 2.5,
    'Private Lawn': 4.0,
    'Private Parking': 3.0,
    'Solar Power': 3.5,
    'Rain Water Harvesting': 2.0,
}


class FacilityAdjustmentEngine:
    """Calculates amenity adjustment percentage and price increment based on selected facilities."""

    @staticmethod
    def calculate_adjustment(base_ml_price: float, selected_amenities: List[str]) -> Dict[str, Any]:
        if not selected_amenities or base_ml_price <= 0:
            return {
                'facility_adjustment_amount': 0.0,
                'facility_adjustment_percent': 0.0,
                'breakdown': [],
                'final_suggested_price': round(base_ml_price, 2)
            }

        total_percent = 0.0
        breakdown = []

        for amenity in selected_amenities:
            weight = FACILITY_WEIGHTS.get(amenity, 1.0)
            amount = (base_ml_price * weight) / 100.0
            total_percent += weight
            breakdown.append({
                'name': amenity,
                'weight_percent': weight,
                'added_value': round(amount, 2)
            })

        total_percent = min(total_percent, 25.0)
        facility_adjustment_amount = round((base_ml_price * total_percent) / 100.0, 2)
        final_suggested_price = round(base_ml_price + facility_adjustment_amount, 2)

        return {
            'facility_adjustment_amount': facility_adjustment_amount,
            'facility_adjustment_percent': round(total_percent, 2),
            'breakdown': breakdown,
            'final_suggested_price': final_suggested_price
        }
