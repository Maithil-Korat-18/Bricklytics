"""Standalone inference using the strict 5-feature contract and promoted v5 model bundle."""
from __future__ import annotations

import json
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'models' / 'price_model.joblib'

_bundle = None

def _load_bundle():
    global _bundle
    if _bundle is None:
        if not MODEL_PATH.exists():
            raise RuntimeError('Price prediction model artifact not found. Run train_and_evaluate.py.')
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def _normalize_property_type(val: str) -> str:
    s = str(val or '').strip().lower()
    if any(k in s for k in ['villa', 'house', 'bungalow', 'row house', 'duplex']):
        return 'Villa'
    return 'Apartment'


def predict_price(property_type: str, bhk: int, area_sqft: float, lat: float | None = None, lon: float | None = None) -> dict:
    bundle = _load_bundle()
    pipeline = bundle['pipeline']
    feature_names = bundle.get('feature_names', ['area_sqft', 'bhk', 'lat', 'lon', 'property_type'])
    is_log_target = bundle.get('is_log_target', True)

    norm_type = _normalize_property_type(property_type)
    latitude = float(lat if lat is not None else 23.0225)
    longitude = float(lon if lon is not None else 72.5714)
    area = max(150.0, float(area_sqft))
    bhk_val = max(1, int(bhk))

    row = pd.DataFrame([{
        'area_sqft': area,
        'bhk': bhk_val,
        'lat': latitude,
        'lon': longitude,
        'property_type': norm_type,
    }], columns=feature_names)

    pred_raw = pipeline.predict(row)[0]
    if is_log_target:
        predicted_price = float(np.expm1(pred_raw))
    else:
        predicted_price = float(pred_raw)

    predicted_price = round(max(500_000.0, predicted_price), 2)

    return {
        'model_used': bundle.get('model_name', 'XGBoost Regressor'),
        'model_version': bundle.get('model_version', 'v5'),
        'ai_fair_price': predicted_price,
        'predicted_price_inr': predicted_price,
        'features_used': {
            'area_sqft': area,
            'bhk': bhk_val,
            'latitude': latitude,
            'longitude': longitude,
            'property_type': norm_type,
        }
    }


if __name__ == '__main__':
    print(json.dumps(predict_price('Apartment', 3, 1450, 23.0225, 72.5714), indent=2))
