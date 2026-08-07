"""
bricklytics_model/data_prep.py
--------------------------------------------------------------------
Preprocesses raw property dataset for price prediction model training.

Excludes all data leakage columns (rate per sqft, POI distance columns, landmark text).
Standardizes area per sqft to area_sqft and property types to Apartment/Villa.
"""

import os
import re
import hashlib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_RAW_PATHS = [
    os.path.join(BASE_DIR, "..", "property_location_amenities_with_type.csv"),
    os.path.join(BASE_DIR, "data", "property_location_amenities_with_type.csv"),
    "/mnt/user-data/uploads/property_location_amenities_with_type.csv",
]


def _normalize_type(val: str) -> str:
    s = str(val or '').strip().lower()
    if any(k in s for k in ['villa', 'house', 'bungalow', 'row house', 'duplex']):
        return 'Villa'
    return 'Apartment'


def find_raw_path() -> str:
    for path in POSSIBLE_RAW_PATHS:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(f"Raw CSV dataset not found at {POSSIBLE_RAW_PATHS}")


def get_dataset_checksum(path: str) -> str:
    hasher = hashlib.md5()
    with open(path, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()[:12]


def load_raw() -> tuple[pd.DataFrame, str]:
    path = find_raw_path()
    checksum = get_dataset_checksum(path)
    return pd.read_csv(path), checksum


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # 1. Rename 'area per sqft' -> 'area_sqft'
    aliases = {'area per sqft': 'area_sqft', 'property type': 'raw_type'}
    df = df.rename(columns={k: v for k, v in aliases.items() if k in df.columns})

    # 2. Extract numeric values
    df['area_sqft'] = pd.to_numeric(df['area_sqft'], errors='coerce')
    df['bhk'] = pd.to_numeric(df['bhk'], errors='coerce')
    df['lat'] = pd.to_numeric(df['lat'], errors='coerce')
    df['lon'] = pd.to_numeric(df['lon'], errors='coerce')
    df['price_cr'] = pd.to_numeric(df['price'], errors='coerce')

    # Convert price in Cr to INR
    df['price_inr'] = np.where(df['price_cr'] < 1000, df['price_cr'] * 10_000_000, df['price_cr'])

    # Calculate sqft_per_bhk ratio to detect clear data-entry corruptions
    df['sqft_per_bhk'] = df['area_sqft'] / df['bhk']

    # Filter out nulls, coordinate boundaries, and clear physical data-entry corruptions
    # Retains legitimate luxury properties up to 15,000 sqft and up to 5,000 sqft/BHK ratio
    df = df.dropna(subset=['area_sqft', 'bhk', 'lat', 'lon', 'price_inr'])
    df = df[
        df['area_sqft'].between(150, 15000) &
        df['bhk'].between(1, 10) &
        df['sqft_per_bhk'].between(100, 5000) &
        df['price_inr'].between(500_000, 300_000_000) &
        df['lat'].between(20.0, 26.0) &
        df['lon'].between(70.0, 75.0)
    ].copy()

    # Normalize property type (Apartment / Villa)
    type_col = 'raw_type' if 'raw_type' in df.columns else 'property_type'
    df['property_type'] = df[type_col].apply(_normalize_type)

    # Strictly select features: area_sqft, bhk, property_type, lat, lon + target price_inr
    cols = ['area_sqft', 'bhk', 'property_type', 'lat', 'lon', 'price_inr']
    return df[cols].reset_index(drop=True)



if __name__ == '__main__':
    raw, checksum = load_raw()
    print(f"Loaded raw dataset ({checksum}): shape {raw.shape}")
    cleaned = clean(raw)
    print(f"Cleaned dataset: shape {cleaned.shape}")
    out_dir = os.path.join(BASE_DIR, "data")
    os.makedirs(out_dir, exist_ok=True)
    cleaned.to_csv(os.path.join(out_dir, "clean_properties.csv"), index=False)
    print("Saved clean properties to data/clean_properties.csv")
