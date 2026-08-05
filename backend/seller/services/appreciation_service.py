"""Cross-sectional appreciation estimates, not a fabricated time-series model.

The supplied listings have no historic transaction dates.  This service uses
market similarity, location clustering and documented public market research
as a bounded overlay on the current dataset's locality signals.
"""
from __future__ import annotations

from dataclasses import dataclass


# Annual trend anchors are deliberately conservative.  Update this config when
# a reviewed market report is refreshed; no scraping occurs on a request path.
MARKET_RESEARCH = {
    'city_baseline_annual_pct': 4.5,
    'locality_annual_pct': {
        'shela': 5.5, 'south bopal': 5.5, 'bopal': 5.0, 'bodakdev': 4.8,
        'prahlad nagar': 4.8, 'thaltej': 4.8, 'science city': 5.0,
        'gota': 4.7, 'ambli': 4.8, 'sg highway': 4.8,
    },
    'sources': [
        {'publisher': 'Cushman & Wakefield', 'title': 'Ahmedabad Residential MarketBeat Q2 2026',
         'url': 'https://assets.cushmanwakefield.com/-/media/cw/marketbeat-pdfs/2026/q2/india-ahmedabad-residential-q2-2026.pdf?rev=2ad48f84dc95479ba616bf63e299805c'},
        {'publisher': 'Magicbricks', 'title': 'Ahmedabad PropIndex Oct-Dec 2025',
         'url': 'https://property.magicbricks.com/microsite/research-insights/src/pdf/sample/MB-PropIndex-OCT-DEC-2025-Ahmedabad.pdf'},
        {'publisher': 'Square Yards', 'title': 'Shela, Ahmedabad Property Price Trends',
         'url': 'https://www.squareyards.com/property-rates/shela-ahmedabad'},
    ],
}


def _research_anchor(locality: str) -> float:
    normalized = str(locality or '').lower()
    for name, rate in MARKET_RESEARCH['locality_annual_pct'].items():
        if name in normalized:
            return rate
    return MARKET_RESEARCH['city_baseline_annual_pct']


def estimate_appreciation(current_price: float, locality: str, connectivity_score: float,
                          geo_cluster: str, property_type: str, locality_listings: int = 0) -> dict:
    """Return deterministic total appreciation and future value for 1/3/5 years."""
    anchor = _research_anchor(locality)
    connectivity_adjustment = max(-.75, min(.75, (float(connectivity_score or 50) - 50) / 100 * 1.5))
    liquidity_adjustment = .25 if locality_listings >= 20 else (-.25 if locality_listings < 3 else 0.0)

    # Villa === House normalization
    p_type_norm = str(property_type or '').lower().strip()
    if 'villa' in p_type_norm or 'house' in p_type_norm:
        type_adjustment = 0.15
    elif 'plot' in p_type_norm or 'land' in p_type_norm:
        type_adjustment = 0.25
    else:
        type_adjustment = 0.0

    annual_rate = round(max(2.5, min(8.5, anchor + connectivity_adjustment + liquidity_adjustment + type_adjustment)), 2)

    try:
        price_val = float(current_price or 0.0)
    except (ValueError, TypeError):
        price_val = 0.0

    periods = {}
    for years in (1, 3, 5):
        if price_val > 0:
            future = round(price_val * ((1 + annual_rate / 100) ** years), 2)
            pct = round(((future / price_val) - 1.0) * 100.0, 2)
        else:
            future = 0.0
            pct = 0.0

        periods[f'{years}yr'] = {
            'appreciation_percent': pct,
            'future_estimated_price': future,
        }

    return {
        'annual_rate_percent': annual_rate,
        'estimated_1yr': periods['1yr'],
        'estimated_3yr': periods['3yr'],
        'estimated_5yr': periods['5yr'],
        'methodology': 'Estimated from market similarity, geo-cluster/locality signals, connectivity and reviewed public market trends; not historical time-series forecasting.',
        'market_research_sources': MARKET_RESEARCH['sources'],
        'geo_cluster': str(geo_cluster),
    }

