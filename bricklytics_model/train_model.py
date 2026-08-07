"""
bricklytics_model/train_model.py
--------------------------------------------------------------------
Trains, validates, and promotes XGBoost house price prediction model with monotonic constraints.
Enforces monotonic constraints ONLY on area_sqft (+1) and bhk (+1).

Performs automated post-training sanity validation:
- Increasing area_sqft (all else fixed) MUST NOT decrease predicted price.
- Increasing bhk (all else fixed) MUST NOT decrease predicted price.
- Increasing area from 1200 to 1800 sqft (even if BHK drops from 3 to 2) MUST NOT decrease price.

Versions every trained model (v1, v2...) to prevent overwriting prior production models.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / 'data' / 'clean_properties.csv'
MODEL_DIR = BASE_DIR / 'models'
REPORT_DIR = BASE_DIR / 'reports'
BACKEND_ML_DIR = BASE_DIR.parent / 'backend' / 'ml_models'

NUMERIC_FEATURES = ['area_sqft', 'bhk', 'lat', 'lon']
CATEGORICAL_FEATURES = ['property_type']
FEATURE_NAMES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def get_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ('numeric', StandardScaler(), NUMERIC_FEATURES),
        ('categorical', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
    ])


def get_next_version(model_dir: Path) -> str:
    """Find next model version number v1, v2... based on existing files."""
    existing_v = []
    if model_dir.exists():
        for p in model_dir.glob('price_model_v*.joblib'):
            match = re.search(r'v(\d+)\.joblib$', p.name)
            if match:
                existing_v.append(int(match.group(1)))
    next_num = max(existing_v) + 1 if existing_v else 1
    return f"v{next_num}"


def compute_metrics(y_true, y_pred) -> dict:
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    mape = float(mean_absolute_percentage_error(y_true, y_pred) * 100)
    r2 = float(r2_score(y_true, y_pred))
    return {
        'mae_inr': round(mae, 2),
        'rmse_inr': round(rmse, 2),
        'mape_pct': round(mape, 2),
        'r2_score': round(r2, 5),
    }


def validate_sanity_tests(pipeline: Pipeline, df: pd.DataFrame) -> dict:
    """
    Automated Sanity Validation Suite:
    1. Area Monotonicity Test: Increasing area_sqft (all else fixed) must NOT decrease price.
    2. BHK Monotonicity Test: Increasing bhk (all else fixed) must NOT decrease price.
    3. User Scenario Test: Increasing area while decreasing BHK (1200 3BHK vs 1800 2BHK) must NOT decrease price.
    """
    print("\n--- Running Automated Post-Training Sanity Validation ---")
    sample_locs = df[['lat', 'lon']].drop_duplicates().head(50).to_dict('records')

    total_tests = 0
    area_violations = 0
    bhk_violations = 0
    user_scenario_violations = 0

    # 1. Area Monotonicity Test
    areas = list(range(400, 6000, 200))
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            for bhk_val in [2, 3, 4]:
                rows = pd.DataFrame([{
                    'area_sqft': a, 'bhk': bhk_val, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype
                } for a in areas])
                preds = pipeline.predict(rows)
                total_tests += len(preds) - 1
                for i in range(len(preds) - 1):
                    if preds[i + 1] < preds[i] - 1.0: # allow 1.0 INR numerical float precision epsilon
                        area_violations += 1

    # 2. BHK Monotonicity Test
    bhks = list(range(1, 7))
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            for area_val in [1000, 1800, 2500]:
                rows = pd.DataFrame([{
                    'area_sqft': area_val, 'bhk': b, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype
                } for b in bhks])
                preds = pipeline.predict(rows)
                total_tests += len(preds) - 1
                for i in range(len(preds) - 1):
                    if preds[i + 1] < preds[i] - 1.0:
                        bhk_violations += 1

    # 3. User Scenario Test: 1200 sqft 3 BHK vs 1800 sqft 2 BHK
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            r1 = pd.DataFrame([{'area_sqft': 1200, 'bhk': 3, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype}])
            r2 = pd.DataFrame([{'area_sqft': 1800, 'bhk': 2, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype}])
            p1 = pipeline.predict(r1)[0]
            p2 = pipeline.predict(r2)[0]
            total_tests += 1
            if p2 < p1 - 1.0:
                user_scenario_violations += 1

    passed = (area_violations == 0) and (bhk_violations == 0) and (user_scenario_violations == 0)

    results = {
        'passed': passed,
        'area_monotonicity_passed': area_violations == 0,
        'bhk_monotonicity_passed': bhk_violations == 0,
        'user_scenario_passed': user_scenario_violations == 0,
        'total_tests_run': total_tests,
        'area_violations': area_violations,
        'bhk_violations': bhk_violations,
        'user_scenario_violations': user_scenario_violations,
    }

    print(f"Sanity Validation Results:")
    print(f"  - Area Monotonicity Test: {'PASSED' if results['area_monotonicity_passed'] else 'FAILED'} ({area_violations} violations)")
    print(f"  - BHK Monotonicity Test: {'PASSED' if results['bhk_monotonicity_passed'] else 'FAILED'} ({bhk_violations} violations)")
    print(f"  - User Scenario Monotonicity Test: {'PASSED' if results['user_scenario_passed'] else 'FAILED'} ({user_scenario_violations} violations)")

    if not passed:
        raise ValueError(f"Automated Sanity Validation FAILED! Model cannot be promoted to production. Results: {results}")

    return results


def main():
    sys.path.insert(0, str(BASE_DIR))
    from data_prep import clean, load_raw

    raw_df, checksum = load_raw()
    df = clean(raw_df)

    print(f"Cleaned dataset loaded ({checksum}): {len(df)} samples.")
    X = df[FEATURE_NAMES]
    y = df['price_inr']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Monotonic constraints:
    # 1st feature (area_sqft): +1 (Increasing area MUST NOT decrease price)
    # 2nd feature (bhk): +1 (Increasing BHK MUST NOT decrease price)
    # 3rd feature (lat): 0
    # 4th feature (lon): 0
    # 5th & 6th features (property_type_Apartment, property_type_Villa): 0, 0
    monotone_constraints = "(1, 1, 0, 0, 0, 0)"

    print("\nTraining production XGBoost Regressor with Monotonic Constraints...")
    xgb_estimator = XGBRegressor(
        n_estimators=250,
        learning_rate=0.05,
        max_depth=4,
        subsample=0.85,
        colsample_bytree=0.85,
        monotone_constraints=monotone_constraints,
        random_state=42,
        n_jobs=-1
    )






    pipeline = Pipeline([
        ('prep', get_preprocessor()),
        ('model', xgb_estimator)
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = compute_metrics(y_test, y_pred)

    print(f"Test Set Performance Metrics:")
    print(f"  R2 Score: {metrics['r2_score']:.4f}")
    print(f"  MAE: INR {metrics['mae_inr']:,.0f}")
    print(f"  RMSE: INR {metrics['rmse_inr']:,.0f}")
    print(f"  MAPE: {metrics['mape_pct']:.2f}%")

    # Fit final pipeline on full dataset
    print("\nFitting final model on full clean dataset...")
    final_pipeline = Pipeline([
        ('prep', get_preprocessor()),
        ('model', xgb_estimator)
    ])
    final_pipeline.fit(X, y)

    # Perform post-training sanity validation
    sanity_results = validate_sanity_tests(final_pipeline, df)

    # Model versioning
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    BACKEND_ML_DIR.mkdir(parents=True, exist_ok=True)

    version_str = get_next_version(MODEL_DIR)
    print(f"\nPromoting model version: {version_str}")

    model_bundle = {
        'artifact_version': 4,
        'model_version': version_str,
        'model_name': 'XGBoost Monotonic',
        'pipeline': final_pipeline,
        'model': final_pipeline.named_steps['model'],
        'feature_names': FEATURE_NAMES,
        'training_timestamp': datetime.now(timezone.utc).isoformat(),
    }

    metadata = {
        'algorithm': 'XGBoost Monotonic',
        'model_version': version_str,
        'training_timestamp': datetime.now(timezone.utc).isoformat(),
        'dataset_checksum': checksum,
        'dataset_total_records': len(df),
        'feature_list': FEATURE_NAMES,
        'monotonic_constraints': {
            'area_sqft': 1,
            'bhk': 1,
            'lat': 0,
            'lon': 0,
            'property_type': 0,
        },
        'target_variable': 'price_inr',
        'evaluation_metrics': metrics,
        'sanity_test_results': sanity_results,
    }

    # Save VERSIONED artifacts (never overwriting old versioned files)
    joblib.dump(model_bundle, MODEL_DIR / f'price_model_{version_str}.joblib')
    joblib.dump(final_pipeline.named_steps['prep'], MODEL_DIR / f'preprocessor_{version_str}.joblib')
    (REPORT_DIR / f'model_metadata_{version_str}.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

    # Save ACTIVE PRODUCTION pointer files for runtime inference
    joblib.dump(model_bundle, MODEL_DIR / 'price_model.joblib')
    joblib.dump(final_pipeline.named_steps['prep'], MODEL_DIR / 'preprocessor.joblib')
    (REPORT_DIR / 'model_metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

    # Copy to backend/ml_models/
    joblib.dump(model_bundle, BACKEND_ML_DIR / f'price_model_{version_str}.joblib')
    joblib.dump(final_pipeline.named_steps['prep'], BACKEND_ML_DIR / f'preprocessor_{version_str}.joblib')
    (BACKEND_ML_DIR / f'model_metadata_{version_str}.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

    joblib.dump(model_bundle, BACKEND_ML_DIR / 'price_model.joblib')
    joblib.dump(final_pipeline.named_steps['prep'], BACKEND_ML_DIR / 'preprocessor.joblib')
    (BACKEND_ML_DIR / 'model_metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

    print(f"Model {version_str} successfully validated, versioned, and promoted to production!")
    return metadata


if __name__ == '__main__':
    main()
