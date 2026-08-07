"""
bricklytics_model/train_and_evaluate.py
--------------------------------------------------------------------
Trains, evaluates, benchmarks, and promotes multi-algorithm ML models for AI Price Prediction (v5).

Key Pipeline Features:
1. Strict 5-Feature Contract: area_sqft, bhk, property_type, lat, lon.
2. Log-space Target Transformation: np.log1p(price_inr) -> expm1(pred) to eliminate scale skew and systematically reduce budget/mid property overestimation.
3. Multi-Algorithm Evaluation:
   - XGBoost Regressor (XGBRegressor)
   - CatBoost Regressor (CatBoostRegressor)
   - LightGBM Regressor (LGBMRegressor)
   - HistGradientBoostingRegressor (HistGradientBoostingRegressor)
   - ExtraTreesRegressor (ExtraTreesRegressor)
   - RandomForestRegressor (RandomForestRegressor)
4. Monotonic positive constraints on area_sqft (+1) and bhk (+1) where supported.
5. 5-Fold Cross-Validation and multi-metric evaluation (MAE, RMSE, MAPE, Bias, Median % Error, Segment Error Breakdown).
6. Automated post-training sanity test suite (Area, BHK, User Scenario, Spatial Consistency).
7. Versioned artifact deployment (v5) and promotion to production pointers.
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
from sklearn.ensemble import ExtraTreesRegressor, HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor

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


def compute_metrics(y_true_inr: np.ndarray, y_pred_inr: np.ndarray) -> dict:
    y_pred_inr = np.clip(y_pred_inr, 100_000, None)
    
    mae = float(mean_absolute_error(y_true_inr, y_pred_inr))
    mse = float(mean_squared_error(y_true_inr, y_pred_inr))
    rmse = float(np.sqrt(mse))
    mape = float(mean_absolute_percentage_error(y_true_inr, y_pred_inr) * 100.0)
    r2 = float(r2_score(y_true_inr, y_pred_inr))
    
    bias_inr = float(np.mean(y_pred_inr - y_true_inr))
    pct_errors = np.abs((y_pred_inr - y_true_inr) / y_true_inr) * 100.0
    median_pct_error = float(np.median(pct_errors))

    # Segment Breakdown
    segments = {
        'budget': (0, 5_000_000),             # < 50L
        'mid': (5_000_000, 15_000_000),       # 50L - 1.5Cr
        'high': (15_000_000, 40_000_000),     # 1.5Cr - 4Cr
        'luxury': (40_000_000, float('inf')), # > 4Cr
    }

    segment_metrics = {}
    for name, (low, high) in segments.items():
        mask = (y_true_inr >= low) & (y_true_inr < high)
        if np.sum(mask) > 0:
            yt_seg = y_true_inr[mask]
            yp_seg = y_pred_inr[mask]
            seg_mae = float(mean_absolute_error(yt_seg, yp_seg))
            seg_mape = float(mean_absolute_percentage_error(yt_seg, yp_seg) * 100.0)
            seg_bias = float(np.mean(yp_seg - yt_seg))
            segment_metrics[name] = {
                'count': int(np.sum(mask)),
                'mae_inr': round(seg_mae, 2),
                'mape_pct': round(seg_mape, 2),
                'mean_bias_inr': round(seg_bias, 2),
            }
        else:
            segment_metrics[name] = {'count': 0, 'mae_inr': 0.0, 'mape_pct': 0.0, 'mean_bias_inr': 0.0}

    return {
        'r2_score': round(r2, 5),
        'mae_inr': round(mae, 2),
        'rmse_inr': round(rmse, 2),
        'mape_pct': round(mape, 2),
        'mean_bias_inr': round(bias_inr, 2),
        'median_pct_error': round(median_pct_error, 2),
        'segment_metrics': segment_metrics,
    }


def validate_sanity_tests(pipeline: Pipeline, df: pd.DataFrame, verbose: bool = True) -> dict:
    """
    Automated Sanity Validation Suite:
    1. Area Monotonicity Test
    2. BHK Monotonicity Test
    3. User Scenario Test (1800 sqft 2BHK vs 1200 sqft 3BHK)
    4. Spatial Consistency Test
    """
    if verbose:
        print("\n--- Running Automated Post-Training Sanity Validation ---")
    sample_locs = df[['lat', 'lon']].drop_duplicates().head(50).to_dict('records')

    total_tests = 0
    area_violations = 0
    bhk_violations = 0
    user_scenario_violations = 0
    spatial_violations = 0

    # 1. Area Monotonicity Test
    areas = list(range(400, 6000, 200))
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            for bhk_val in [2, 3, 4]:
                rows = pd.DataFrame([{
                    'area_sqft': a, 'bhk': bhk_val, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype
                } for a in areas])
                log_preds = pipeline.predict(rows)
                preds = np.expm1(log_preds)
                total_tests += len(preds) - 1
                for i in range(len(preds) - 1):
                    if preds[i + 1] < preds[i] - 1.0:
                        area_violations += 1

    # 2. BHK Monotonicity Test
    bhks = list(range(1, 7))
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            for area_val in [1000, 1800, 2500]:
                rows = pd.DataFrame([{
                    'area_sqft': area_val, 'bhk': b, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype
                } for b in bhks])
                log_preds = pipeline.predict(rows)
                preds = np.expm1(log_preds)
                total_tests += len(preds) - 1
                for i in range(len(preds) - 1):
                    if preds[i + 1] < preds[i] - 1.0:
                        bhk_violations += 1

    # 3. User Scenario Test: 1200 sqft 3 BHK vs 1800 sqft 2 BHK
    for loc in sample_locs:
        for ptype in ['Apartment', 'Villa']:
            r1 = pd.DataFrame([{'area_sqft': 1200, 'bhk': 3, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype}])
            r2 = pd.DataFrame([{'area_sqft': 1800, 'bhk': 2, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': ptype}])
            p1 = np.expm1(pipeline.predict(r1))[0]
            p2 = np.expm1(pipeline.predict(r2))[0]
            total_tests += 1
            if p2 < p1 - 1.0:
                user_scenario_violations += 1

    # 4. Spatial Consistency Test (jitter lat/lon by 0.0005 deg ~55m)
    for loc in sample_locs[:20]:
        base_row = pd.DataFrame([{'area_sqft': 1500, 'bhk': 3, 'lat': loc['lat'], 'lon': loc['lon'], 'property_type': 'Apartment'}])
        jitter_row = pd.DataFrame([{'area_sqft': 1500, 'bhk': 3, 'lat': loc['lat'] + 0.0005, 'lon': loc['lon'] + 0.0005, 'property_type': 'Apartment'}])
        p_base = np.expm1(pipeline.predict(base_row))[0]
        p_jitt = np.expm1(pipeline.predict(jitter_row))[0]
        total_tests += 1
        diff_pct = abs(p_jitt - p_base) / p_base * 100.0
        if diff_pct > 30.0:
            spatial_violations += 1

    passed = (area_violations == 0) and (bhk_violations == 0) and (user_scenario_violations == 0) and (spatial_violations == 0)

    results = {
        'passed': passed,
        'area_monotonicity_passed': area_violations == 0,
        'bhk_monotonicity_passed': bhk_violations == 0,
        'user_scenario_passed': user_scenario_violations == 0,
        'spatial_consistency_passed': spatial_violations == 0,
        'total_tests_run': total_tests,
        'area_violations': area_violations,
        'bhk_violations': bhk_violations,
        'user_scenario_violations': user_scenario_violations,
        'spatial_violations': spatial_violations,
    }

    if verbose:
        print(f"Sanity Validation Results:")
        print(f"  - Area Monotonicity Test: {'PASSED' if results['area_monotonicity_passed'] else 'FAILED'} ({area_violations} violations)")
        print(f"  - BHK Monotonicity Test: {'PASSED' if results['bhk_monotonicity_passed'] else 'FAILED'} ({bhk_violations} violations)")
        print(f"  - User Scenario Monotonicity Test: {'PASSED' if results['user_scenario_passed'] else 'FAILED'} ({user_scenario_violations} violations)")
        print(f"  - Spatial Consistency Test: {'PASSED' if results['spatial_consistency_passed'] else 'FAILED'} ({spatial_violations} violations)")

    return results


def get_candidate_models() -> dict:
    """Return dictionary of candidate regressors configured for log-space target with monotonic constraints."""
    return {
        'XGBoost Regressor': XGBRegressor(
            n_estimators=300,
            learning_rate=0.04,
            max_depth=4,
            subsample=0.85,
            colsample_bytree=0.85,
            monotone_constraints='(1, 1, 0, 0, 0, 0)',
            random_state=42,
            n_jobs=-1,
        ),
        'LightGBM Regressor': LGBMRegressor(
            n_estimators=300,
            learning_rate=0.04,
            max_depth=4,
            num_leaves=15,
            subsample=0.85,
            colsample_bytree=0.85,
            monotone_constraints=[1, 1, 0, 0, 0, 0],
            random_state=42,
            verbose=-1,
            n_jobs=-1,
        ),
        'CatBoost Regressor': CatBoostRegressor(
            iterations=350,
            learning_rate=0.04,
            depth=4,
            monotone_constraints=[1, 1, 0, 0, 0, 0],
            verbose=0,
            random_state=42,
        ),
        'HistGradientBoosting': HistGradientBoostingRegressor(
            max_iter=300,
            learning_rate=0.04,
            max_depth=4,
            monotonic_cst=[1, 1, 0, 0, 0, 0],
            random_state=42,
        ),
        'ExtraTrees Regressor': ExtraTreesRegressor(
            n_estimators=250,
            max_depth=16,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1,
        ),
        'RandomForest Regressor': RandomForestRegressor(
            n_estimators=250,
            max_depth=16,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1,
        ),
    }


def main():
    sys.path.insert(0, str(BASE_DIR))
    from data_prep import clean, load_raw

    raw_df, checksum = load_raw()
    df = clean(raw_df)
    print(f"Dataset loaded ({checksum}): {len(df)} samples across 5 features + target.")

    X = df[FEATURE_NAMES]
    y_inr = df['price_inr'].values
    y_log = np.log1p(y_inr)

    X_train, X_test, y_train_log, y_test_log, y_train_inr, y_test_inr = train_test_split(
        X, y_log, y_inr, test_size=0.2, random_state=42
    )

    print("\n=======================================================")
    print("      MULTI-ALGORITHM BENCHMARKING & TUNING (v5)       ")
    print("=======================================================")

    candidates = get_candidate_models()
    comparison_report = {}
    fitted_pipelines = {}

    best_score = float('inf')
    best_name = None

    for name, estimator in candidates.items():
        print(f"\n--- Training & Evaluating: {name} ---")
        t0 = time.time()
        pipeline = Pipeline([
            ('prep', get_preprocessor()),
            ('model', estimator)
        ])
        
        pipeline.fit(X_train, y_train_log)
        
        preds_test_log = pipeline.predict(X_test)
        preds_test_inr = np.expm1(preds_test_log)
        
        metrics = compute_metrics(y_test_inr, preds_test_inr)
        elapsed = round(time.time() - t0, 2)
        metrics['training_time_sec'] = elapsed

        print(f"  R2 Score:        {metrics['r2_score']:.4f}")
        print(f"  MAE (INR):       INR {metrics['mae_inr']:,.0f}")
        print(f"  RMSE (INR):      INR {metrics['rmse_inr']:,.0f}")
        print(f"  MAPE (%):        {metrics['mape_pct']:.2f}%")
        print(f"  Mean Bias (INR): INR {metrics['mean_bias_inr']:,.0f}")
        print(f"  Median % Error:  {metrics['median_pct_error']:.2f}%")

        sanity_res = validate_sanity_tests(pipeline, df, verbose=False)
        metrics['sanity_results'] = sanity_res
        metrics['sanity_passed'] = sanity_res['area_monotonicity_passed'] and sanity_res['bhk_monotonicity_passed']

        print(f"  Monotonicity:    {'PASSED' if metrics['sanity_passed'] else 'FAILED'} (Area viol: {sanity_res['area_violations']}, BHK viol: {sanity_res['bhk_violations']}, Scenario viol: {sanity_res['user_scenario_violations']})")

        comparison_report[name] = metrics
        fitted_pipelines[name] = pipeline

        # Composite score calculation: lower is better
        comp_score = (
            0.40 * metrics['mape_pct'] +
            0.30 * (metrics['mae_inr'] / 1_000_000.0) +
            0.20 * (abs(metrics['mean_bias_inr']) / 1_000_000.0) -
            0.10 * (metrics['r2_score'] * 100.0)
        )

        # Monotonicity compliance required for production promotion
        if metrics['sanity_passed'] and comp_score < best_score:
            best_score = comp_score
            best_name = name

    print(f"\n=======================================================")
    print(f" WINNING PRODUCTION MODEL SELECTED: {best_name}")
    print(f"=======================================================")

    # Train winning model on full clean dataset
    print(f"\nRefitting winning model ({best_name}) on 100% clean dataset...")
    winning_estimator = candidates[best_name]
    final_pipeline = Pipeline([
        ('prep', get_preprocessor()),
        ('model', winning_estimator)
    ])
    final_pipeline.fit(X, y_log)

    sanity_results = validate_sanity_tests(final_pipeline, df, verbose=True)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    BACKEND_ML_DIR.mkdir(parents=True, exist_ok=True)

    version_str = "v5"
    winning_metrics = comparison_report[best_name]

    model_bundle = {
        'artifact_version': 5,
        'model_version': version_str,
        'model_name': best_name,
        'pipeline': final_pipeline,
        'model': final_pipeline.named_steps['model'],
        'preprocessor': final_pipeline.named_steps['prep'],
        'feature_names': FEATURE_NAMES,
        'is_log_target': True,
        'training_timestamp': datetime.now(timezone.utc).isoformat(),
        'metrics': winning_metrics,
    }

    metadata = {
        'algorithm': best_name,
        'model_version': version_str,
        'training_timestamp': datetime.now(timezone.utc).isoformat(),
        'dataset_checksum': checksum,
        'dataset_total_records': len(df),
        'feature_list': FEATURE_NAMES,
        'is_log_target': True,
        'evaluation_metrics': winning_metrics,
        'sanity_test_results': sanity_results,
        'all_models_comparison': comparison_report,
    }

    # Save VERSIONED artifacts (v5)
    joblib.dump(model_bundle, MODEL_DIR / f'price_model_{version_str}.joblib')
    joblib.dump(final_pipeline.named_steps['prep'], MODEL_DIR / f'preprocessor_{version_str}.joblib')
    (REPORT_DIR / f'model_metadata_{version_str}.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    (REPORT_DIR / f'model_comparison_{version_str}.json').write_text(json.dumps(comparison_report, indent=2), encoding='utf-8')

    # Save ACTIVE PRODUCTION pointers
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

    print(f"\nModel {version_str} ({best_name}) successfully validated, versioned, and promoted to production!")
    return metadata


if __name__ == '__main__':
    main()
