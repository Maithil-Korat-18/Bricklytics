"""
backend/ml_models/train_price_model.py
Training pipeline for Bricklytics Property Price Prediction Model.

Evaluates 6 Candidate Regressors:
1. XGBoost (XGBRegressor)
2. CatBoost (CatBoostRegressor)
3. LightGBM (LGBMRegressor)
4. Random Forest (RandomForestRegressor)
5. Extra Trees (ExtraTreesRegressor)
6. Gradient Boosting (GradientBoostingRegressor)

Target: price (scaled to INR: price * 10,000,000 when price < 1000)
Features Used:
- area_per_sqft (from 'area per sqft', treated identically to Carpet Area)
- bhk (from 'bhk')
- property_type (from 'property type')
- lat (from 'lat')
- lon (from 'lon')

Excludes all other features.
Saves:
- price_model.joblib
- preprocessor.joblib
"""

import os
import sys
import json
import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error, r2_score

from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent
CSV_PATH = PROJECT_ROOT / 'property_location_amenities_with_type.csv'

NUMERIC_FEATURES = ['area_per_sqft', 'bhk', 'lat', 'lon']
CATEGORICAL_FEATURES = ['property_type']
FEATURE_NAMES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def create_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ('numeric', StandardScaler(), NUMERIC_FEATURES),
        ('categorical', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
    ])


def load_and_preprocess_data(csv_path: Path = CSV_PATH) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(f'Dataset CSV file not found at {csv_path}')
    
    df = pd.read_csv(csv_path)
    
    # Rename columns to standard names
    column_mapping = {
        'area per sqft': 'area_per_sqft',
        'property type': 'property_type',
        'lat': 'lat',
        'lon': 'lon',
        'bhk': 'bhk',
        'price': 'price',
    }
    df = df.rename(columns=column_mapping)
    
    # Keep only required columns
    required_cols = list(column_mapping.values())
    df = df[required_cols].copy()
    
    # Convert numerical features
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(df[col].median())
        
    # Clean property_type
    df['property_type'] = df['property_type'].fillna('flat').astype(str).str.lower().str.strip()
    
    # Target price scaling: If price is in Crores (< 1000), convert to INR
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['price'])
    df['target_price'] = np.where(df['price'] < 1000.0, df['price'] * 10_000_000.0, df['price'])
    
    # Filter out invalid or extreme outliers
    df = df[(df['target_price'] > 100_000) & (df['area_per_sqft'] > 50)].copy()
    
    return df


def get_candidate_models() -> dict:
    candidates = {
        'Random Forest': RandomForestRegressor(n_estimators=150, max_depth=15, min_samples_leaf=2, random_state=42, n_jobs=-1),
        'Extra Trees': ExtraTreesRegressor(n_estimators=150, max_depth=15, min_samples_leaf=2, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=5, random_state=42),
    }

    try:
        from xgboost import XGBRegressor
        candidates['XGBoost'] = XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, subsample=0.8, colsample_bytree=0.8, random_state=42, n_jobs=-1)
    except ImportError:
        print('[Warning] XGBoost is not installed. Skipping XGBoost.')

    try:
        from lightgbm import LGBMRegressor
        candidates['LightGBM'] = LGBMRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, num_leaves=31, random_state=42, verbosity=-1)
    except ImportError:
        print('[Warning] LightGBM is not installed. Skipping LightGBM.')

    try:
        from catboost import CatBoostRegressor
        candidates['CatBoost'] = CatBoostRegressor(iterations=250, learning_rate=0.05, depth=6, random_seed=42, verbose=False)
    except ImportError:
        print('[Warning] CatBoost is not installed. Skipping CatBoost.')

    return candidates


def evaluate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mse = mean_squared_error(y_true, y_pred)
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_true, y_pred))
    mape = float(mean_absolute_percentage_error(y_true, y_pred) * 100.0)
    r2 = float(r2_score(y_true, y_pred))
    return {
        'r2': round(r2, 4),
        'rmse': round(rmse, 2),
        'mae': round(mae, 2),
        'mape_pct': round(mape, 2),
    }


def train_and_select_best_model():
    print(f'Loading data from: {CSV_PATH}')
    df = load_and_preprocess_data()
    print(f'Total valid property samples: {len(df)}')

    X = df[FEATURE_NAMES]
    y = df['target_price']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = create_preprocessor()
    preprocessor.fit(X_train)

    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    candidates = get_candidate_models()
    results = {}
    fitted_models = {}

    print('\n==================================================')
    print('EVALUATING CANDIDATE MODELS')
    print('==================================================')

    for name, model in candidates.items():
        start_time = time.time()
        model.fit(X_train_trans, y_train)
        preds = model.predict(X_test_trans)
        elapsed = round(time.time() - start_time, 2)

        metrics = evaluate_metrics(y_test.values, preds)
        metrics['time_seconds'] = elapsed
        results[name] = metrics
        fitted_models[name] = model

        print(f'Model: {name:<18} | R2: {metrics["r2"]:>7.4f} | RMSE: Rs.{metrics["rmse"]:>12,.2f} | MAE: Rs.{metrics["mae"]:>10,.2f} | MAPE: {metrics["mape_pct"]:>6.2f}% | Time: {elapsed}s')

    # Select best model based on highest R2
    best_name = max(results, key=lambda k: results[k]['r2'])
    best_model = fitted_models[best_name]
    best_metrics = results[best_name]

    print('\n==================================================')
    print(f'BEST PERFORMING MODEL: {best_name}')
    print(f'R2: {best_metrics["r2"]} | RMSE: Rs.{best_metrics["rmse"]:,.2f} | MAE: Rs.{best_metrics["mae"]:,.2f} | MAPE: {best_metrics["mape_pct"]}%')
    print('==================================================')

    # Fit best model on entire dataset for final deployment artifact
    X_full_trans = preprocessor.transform(X)
    best_model.fit(X_full_trans, y)

    # Save artifacts
    model_out_path = BASE_DIR / 'price_model.joblib'
    prep_out_path = BASE_DIR / 'preprocessor.joblib'

    model_bundle = {
        'model': best_model,
        'model_name': best_name,
        'feature_names': FEATURE_NAMES,
        'numeric_features': NUMERIC_FEATURES,
        'categorical_features': CATEGORICAL_FEATURES,
        'metrics': best_metrics,
        'candidate_comparison': results,
    }

    joblib.dump(model_bundle, model_out_path)
    joblib.dump(preprocessor, prep_out_path)

    print(f'\n[Success] Saved price_model.joblib to: {model_out_path}')
    print(f'[Success] Saved preprocessor.joblib to: {prep_out_path}')

    # Also copy to bricklytics_model directory if it exists
    alt_dir = PROJECT_ROOT / 'bricklytics_model' / 'models'
    if alt_dir.exists():
        joblib.dump(model_bundle, alt_dir / 'price_model.joblib')
        joblib.dump(preprocessor, alt_dir / 'preprocessor.joblib')
        print(f'[Success] Copied artifacts to: {alt_dir}')


if __name__ == '__main__':
    train_and_select_best_model()
