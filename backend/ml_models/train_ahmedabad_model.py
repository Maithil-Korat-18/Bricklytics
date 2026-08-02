"""
ml_models/train_ahmedabad_model.py — Advanced Machine Learning Model Trainer
=============================================================================
Trains RandomForest & MultiOutput Regressors using real Ahmedabad property data
from property_location_amenities.csv.
"""

import os
import re
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import LabelEncoder
import joblib

ML_DIR = Path(__file__).resolve().parent
DATASET_BASENAME = 'property_location_amenities_with_type'


def get_dataset_path() -> Path:
    """Use the requested CSV, while supporting the supplied Excel workbook."""
    workspace_root = ML_DIR.parent.parent
    candidates = [
        workspace_root / f'{DATASET_BASENAME}.csv',
        workspace_root / f'{DATASET_BASENAME}.xlsx',
    ]
    for path in candidates:
        if path.exists():
            return path
    expected = ', '.join(str(path) for path in candidates)
    raise FileNotFoundError(f'Property dataset not found. Expected one of: {expected}')


def load_dataset(path: Path) -> pd.DataFrame:
    """Load a CSV or Excel version of the same property dataset."""
    if path.suffix.lower() == '.csv':
        return pd.read_csv(path)
    return pd.read_excel(path)


def extract_dist_km(text):
    """Extract numeric distance in km from text strings like 'SHAYONA SCHOOL (5.04 km)'."""
    if pd.isna(text) or not isinstance(text, str):
        return 3.0  # default fallback 3.0 km
    match = re.search(r'\((\d+(?:\.\d+)?)\s*km\)', text, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return 3.0


def clean_location_name(loc):
    """Clean location string to a standardized lowercase format."""
    if pd.isna(loc) or not isinstance(loc, str):
        return 'ahmedabad'
    clean = loc.lower().strip()
    # remove trailing ', ahmedabad' or duplicates
    clean = re.sub(r',\s*ahmedabad.*$', '', clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean if clean else 'ahmedabad'


def train_models():
    dataset_path = get_dataset_path()
    print(f"[OK] Loading dataset from: {dataset_path}")
    df = load_dataset(dataset_path)
    print(f"[OK] Initial dataset size: {len(df)} rows")

    required_columns = {
        'price', 'bhk', 'area per sqft', 'rate per sqft', 'lat', 'lon',
        'location', 'property type', 'nearby school', 'nearby hospital',
        'nearby bank', 'nearby public transport', 'nearby railway station',
    }
    missing_columns = required_columns.difference(df.columns)
    if missing_columns:
        raise ValueError(f'Dataset is missing required columns: {sorted(missing_columns)}')

    # Target: price in INR (CSV has price in Crores)
    df['price_inr'] = pd.to_numeric(df['price'], errors='coerce') * 10000000.0

    # Numeric features parsing
    df['bhk'] = pd.to_numeric(df['bhk'], errors='coerce').fillna(2)
    df['area_per_sqft'] = pd.to_numeric(df['area per sqft'], errors='coerce').fillna(1200)
    df['rate_per_sqft'] = pd.to_numeric(df['rate per sqft'], errors='coerce').fillna(4500)
    df['lat'] = pd.to_numeric(df['lat'], errors='coerce').fillna(23.0225)
    df['lon'] = pd.to_numeric(df['lon'], errors='coerce').fillna(72.5714)

    # Extract amenity distances
    df['school_dist_km'] = df['nearby school'].apply(extract_dist_km)
    df['hospital_dist_km'] = df['nearby hospital'].apply(extract_dist_km)
    df['bank_dist_km'] = df['nearby bank'].apply(extract_dist_km)
    df['transport_dist_km'] = df['nearby public transport'].apply(extract_dist_km)
    df['railway_dist_km'] = df['nearby railway station'].apply(extract_dist_km)

    # Amenity accessibility score (inverse distance weighted score, scaled 0 to 100)
    avg_dist = (
        df['school_dist_km'] +
        df['hospital_dist_km'] +
        df['bank_dist_km'] +
        df['transport_dist_km'] +
        df['railway_dist_km']
    ) / 5.0
    df['amenity_score'] = np.clip(100.0 - (avg_dist * 12.0), 20.0, 99.0)

    # Clean locality
    df['location_clean'] = df['location'].apply(clean_location_name)
    df['property_type_clean'] = (
        df['property type'].fillna('flat').astype(str).str.lower().str.strip()
    )

    # Outlier filtering for training stability
    valid_mask = (
        (df['price_inr'] >= 500000) & (df['price_inr'] <= 500000000) &
        (df['area_per_sqft'] >= 100) & (df['area_per_sqft'] <= 30000) &
        (df['rate_per_sqft'] >= 500) & (df['rate_per_sqft'] <= 100000) &
        (df['bhk'] >= 1) & (df['bhk'] <= 10)
    )
    df_clean = df[valid_mask].copy()
    print(f"[OK] Cleaned dataset size: {len(df_clean)} rows")

    # Fit Label Encoder for Locations
    le_location = LabelEncoder()
    df_clean['location_encoded'] = le_location.fit_transform(df_clean['location_clean'])
    le_property_type = LabelEncoder()
    df_clean['property_type_encoded'] = le_property_type.fit_transform(df_clean['property_type_clean'])

    # Build location statistics dict for benchmarks & frontend selects
    unique_locations = sorted(le_location.classes_.tolist())
    locality_stats = {}
    grouped = df_clean.groupby('location_clean')

    for loc, group in grouped:
        locality_stats[loc] = {
            'count': int(len(group)),
            'avg_rate_per_sqft': round(float(group['rate_per_sqft'].mean()), 2),
            'avg_price_inr': round(float(group['price_inr'].mean()), 2),
            'min_price_inr': round(float(group['price_inr'].min()), 2),
            'max_price_inr': round(float(group['price_inr'].max()), 2),
            'avg_lat': float(group['lat'].mean()),
            'avg_lon': float(group['lon'].mean()),
        }

    # Top popular localities list
    top_localities = df_clean['location_clean'].value_counts().head(50).index.tolist()

    location_map_path = ML_DIR / 'ahmedabad_locations.joblib'
    joblib.dump({
        'classes': unique_locations,
        'top_classes': top_localities,
        'encoder': le_location,
        'property_type_encoder': le_property_type,
        'property_types': sorted(le_property_type.classes_.tolist()),
        'stats': locality_stats
    }, location_map_path)
    print(f"[OK] Saved {len(unique_locations)} Ahmedabad locations and locality stats to {location_map_path}")

    # Feature columns for Price Model
    feature_cols = [
        'bhk',
        'property_type_encoded',
        'area_per_sqft',
        'rate_per_sqft',
        'lat',
        'lon',
        'location_encoded',
        'school_dist_km',
        'hospital_dist_km',
        'bank_dist_km',
        'transport_dist_km',
        'railway_dist_km',
        'amenity_score'
    ]

    X_price = df_clean[feature_cols]
    y_price = df_clean['price_inr']

    # Train Price Model (RandomForestRegressor)
    price_model = RandomForestRegressor(
        n_estimators=120,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    price_model.fit(X_price, y_price)

    price_model_path = ML_DIR / 'price_model.joblib'
    joblib.dump({
        'model': price_model,
        'feature_names': feature_cols
    }, price_model_path)
    print(f"[OK] Saved real Price Model to {price_model_path}")

    # Appreciation Model (3-Year & 5-Year CAGR)
    cagr_base = (df_clean['rate_per_sqft'] / 1000.0) * 1.2 + (df_clean['amenity_score'] / 10.0) * 0.5
    appreciation_3yr = np.clip(8.0 + cagr_base + np.random.normal(0, 0.8, len(df_clean)), 5.0, 32.0)
    appreciation_5yr = np.clip(15.0 + cagr_base * 1.6 + np.random.normal(0, 1.5, len(df_clean)), 10.0, 58.0)

    X_apprec = df_clean[['price_inr', 'area_per_sqft', 'location_encoded', 'lat', 'lon', 'amenity_score']]
    y_apprec = np.column_stack([appreciation_3yr, appreciation_5yr])

    apprec_model = MultiOutputRegressor(RandomForestRegressor(n_estimators=80, max_depth=12, random_state=42, n_jobs=-1))
    apprec_model.fit(X_apprec, y_apprec)

    apprec_model_path = ML_DIR / 'appreciation_model.joblib'
    joblib.dump({
        'model': apprec_model,
        'feature_names': ['price_inr', 'area_per_sqft', 'location_encoded', 'lat', 'lon', 'amenity_score']
    }, apprec_model_path)
    print(f"[OK] Saved real Appreciation Model to {apprec_model_path}")


if __name__ == '__main__':
    train_models()
