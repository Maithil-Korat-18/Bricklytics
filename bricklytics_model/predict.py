"""Standalone inference using the same approved feature contract as training."""
from __future__ import annotations

import json
from pathlib import Path
import sys

import joblib
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from amenity_scoring import amenity_adjustment_inr, amenity_score_0_100

BASE_DIR = Path(__file__).resolve().parent
_bundle = joblib.load(BASE_DIR / 'models' / 'price_model.joblib')


def _context(locality: str) -> tuple[str, dict]:
    locality = str(locality or 'ahmedabad').strip()
    lookup = _bundle['locality_lookup']
    key = locality.lower()
    if key in lookup:
        return locality, lookup[key]
    candidates = [name for name in lookup if key in name or name in key]
    if candidates:
        return locality, lookup[candidates[0]]
    defaults = _bundle['defaults']
    return locality, {'avg_rate_per_sqft': defaults['rate_per_sqft'], 'avg_connectivity': defaults['connectivity_score'],
                      'lat': defaults['lat'], 'lon': defaults['lon'], 'geo_cluster': 'unknown'}


def predict_listing(property_type: str, bhk: int, area_sqft: float, amenities: list[str] | None = None,
                    locality: str | None = None, lat: float | None = None, lon: float | None = None,
                    rate_per_sqft: float | None = None) -> dict:
    if _bundle.get('artifact_version') != 2:
        raise RuntimeError('Run train_model.py to create the current model artifact.')
    locality, context = _context(locality or '')
    base_rate = float(rate_per_sqft or context['avg_rate_per_sqft'])
    row = pd.DataFrame([{
        'bhk': int(bhk), 'area_per_sqft': float(area_sqft), 'rate_per_sqft': base_rate,
        'connectivity_score': float(context['avg_connectivity']), 'lat': float(lat if lat is not None else context['lat']),
        'lon': float(lon if lon is not None else context['lon']),
        'property_type': {'apartment': 'flat', 'villa': 'house'}.get(str(property_type).lower(), str(property_type).lower()),
        'locality_raw': locality, 'geo_cluster': str(context.get('geo_cluster', 'unknown')),
    }], columns=_bundle['feature_names'])
    base_price = round(float(_bundle['pipeline'].predict(row)[0]), 2)
    amenity_value = amenity_adjustment_inr(amenities)
    return {
        'model_used': _bundle['model_name'], 'base_price_ml_model_inr': base_price,
        'amenity_value_adjustment_inr': amenity_value, 'final_estimated_price_inr': round(base_price + amenity_value, 2),
        'amenity_score': amenity_score_0_100(amenities), 'geo_cluster': context.get('geo_cluster'),
        'training_note': 'Amenities and raw POI distances are excluded from the ML model.',
    }


if __name__ == '__main__':
    print(json.dumps(predict_listing('flat', 3, 1450, ['Security', 'Gym'], 'South Bopal'), indent=2))
