"""
ml_models/generate_models.py — Train and save ML models (price_model.joblib & appreciation_model.joblib)
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
import joblib

ML_DIR = Path(__file__).resolve().parent

def train_and_save_models():
    np.random.seed(42)
    n_samples = 1000

    # Synthetic Dataset
    area_sqft = np.random.uniform(500, 5000, n_samples)
    bedrooms = np.random.randint(1, 6, n_samples)
    bathrooms = np.random.randint(1, 5, n_samples)
    year_built = np.random.randint(1990, 2024, n_samples)
    property_type_encoded = np.random.randint(0, 6, n_samples) # 0: apartment, 1: villa, 2: house, etc.
    city_encoded = np.random.randint(0, 5, n_samples)          # 0: LA, 1: NY, 2: SF, 3: Austin, 4: Miami

    # Base price calculation with noise
    base_price = (
        area_sqft * 350 +
        bedrooms * 25000 +
        bathrooms * 18000 +
        (year_built - 1990) * 1500 +
        property_type_encoded * 40000 +
        city_encoded * 60000 +
        np.random.normal(0, 25000, n_samples)
    )
    base_price = np.maximum(base_price, 50000)

    X_price = pd.DataFrame({
        'area_sqft': area_sqft,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'year_built': year_built,
        'property_type_encoded': property_type_encoded,
        'city_encoded': city_encoded,
    })
    y_price = base_price

    # Train Price Model
    price_model = RandomForestRegressor(n_estimators=50, random_state=42)
    price_model.fit(X_price, y_price)

    price_model_path = ML_DIR / 'price_model.joblib'
    joblib.dump(price_model, price_model_path)
    print(f"[OK] Saved price_model.joblib to {price_model_path}")

    # 3-year & 5-year appreciation rates (%)
    appreciation_3yr = 12.0 + city_encoded * 2.5 + (2025 - year_built) * 0.15 + np.random.normal(0, 1.5, n_samples)
    appreciation_5yr = 22.0 + city_encoded * 4.0 + (2025 - year_built) * 0.25 + np.random.normal(0, 2.5, n_samples)
    
    appreciation_3yr = np.clip(appreciation_3yr, 5.0, 45.0)
    appreciation_5yr = np.clip(appreciation_5yr, 10.0, 85.0)

    X_apprec = pd.DataFrame({
        'price': base_price,
        'area_sqft': area_sqft,
        'year_built': year_built,
        'city_encoded': city_encoded,
    })
    y_apprec = np.column_stack([appreciation_3yr, appreciation_5yr])

    apprec_model = MultiOutputRegressor(RandomForestRegressor(n_estimators=50, random_state=42))
    apprec_model.fit(X_apprec, y_apprec)

    apprec_model_path = ML_DIR / 'appreciation_model.joblib'
    joblib.dump(apprec_model, apprec_model_path)
    print(f"[OK] Saved appreciation_model.joblib to {apprec_model_path}")

if __name__ == '__main__':
    train_and_save_models()
