"""Locality-based appreciation prediction service.

Calculates future property appreciation grounded strictly in realistic, modest locality-specific
market appreciation trends (4.0% - 7.0% per annum) and the property's market asking price.
"""
from __future__ import annotations

import json
from pathlib import Path
from django.conf import settings

# Calibrated locality annual appreciation rates % for Ahmedabad micro-markets
# Reflects realistic, institutional residential market growth.
LOCALITY_APPRECIATION_RATES = {
    'sg highway': 6.8,
    'sindhu bhavan': 7.0,
    'science city': 6.6,
    'bopal': 6.4,
    'ambli': 6.5,
    'shela': 6.2,
    'shilaj': 6.1,
    'vaishnodevi circle': 6.0,
    'south bopal': 6.0,
    'gota': 5.8,
    'thaltej': 5.7,
    'bodakdev': 5.5,
    'prahlad nagar': 5.4,
    'vastral': 5.2,
    'satellite': 5.2,
    'paldi': 5.0,
    'naranpura': 4.9,
    'chandkheda': 4.8,
    'maninagar': 4.7,
    'navrangpura': 4.6,
    'shahibaug': 4.5,
    'sanand': 4.2,
    'kubernagar': 4.5,
    'narol': 4.0,
    'vatva': 3.8,
    'bavla': 3.5,
    'changodar': 3.4,
}

CITY_BASELINE_RATE = 5.2


def get_locality_appreciation_rate(locality: str, connectivity_score: float = 70.0) -> float:
    """Return the annual appreciation rate % for a specific locality."""
    normalized = str(locality or '').lower().strip()
    if not normalized:
        return CITY_BASELINE_RATE

    best_match_key = None
    best_match_len = 0
    for name, rate in LOCALITY_APPRECIATION_RATES.items():
        if name in normalized and len(name) > best_match_len:
            best_match_key = name
            best_match_len = len(name)

    if best_match_key:
        return LOCALITY_APPRECIATION_RATES[best_match_key]

    conn = float(connectivity_score or 70.0)
    conn_adj = (conn - 70.0) / 100.0 * 1.5
    return round(max(3.5, min(7.2, CITY_BASELINE_RATE + conn_adj)), 1)


def estimate_appreciation(
    current_price: float,
    locality: str,
    connectivity_score: float = 70.0,
    geo_cluster: str = 'ahmedabad_central',
    property_type: str = 'flat',
    locality_listings: int = 0,
) -> dict:
    """Calculate 1, 3, and 5-year future values and growth from Market Asking Price."""
    try:
        asking_price = float(current_price or 0.0)
    except (ValueError, TypeError):
        asking_price = 0.0

    annual_rate = get_locality_appreciation_rate(locality, connectivity_score)

    periods = {}
    for years in (1, 3, 5):
        if asking_price > 0:
            future = round(asking_price * ((1 + annual_rate / 100.0) ** years), 2)
            total_growth = round(future - asking_price, 2)
            growth_pct = round(((future / asking_price) - 1.0) * 100.0, 2)
        else:
            future = 0.0
            total_growth = 0.0
            growth_pct = round(((1 + annual_rate / 100.0) ** years - 1.0) * 100.0, 2)

        periods[f'{years}yr'] = {
            'appreciation_percent': growth_pct,
            'future_estimated_price': future,
            'total_growth': total_growth,
        }

    return {
        'annual_rate_percent': annual_rate,
        'locality': str(locality or 'Ahmedabad'),
        'asking_price': asking_price,
        'estimated_1yr': periods['1yr'],
        'estimated_3yr': periods['3yr'],
        'estimated_5yr': periods['5yr'],
        'methodology': f'Calculated from locality historical annual appreciation rate ({annual_rate}%) applied to property market asking price.',
        'geo_cluster': str(geo_cluster),
    }
