"""Train and select the deployed property-price regressor.

Only meaningful supplied columns are used.  The five raw POI-distance columns
are intentionally excluded; their aggregate `connectivity_score` is retained.
Amenities are never read by this module.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import KFold, RandomizedSearchCV, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / 'data' / 'clean_properties.csv'
MODEL_OUT = BASE_DIR / 'models' / 'price_model.joblib'
METRICS_OUT = BASE_DIR / 'reports' / 'model_comparison.json'
NUMERIC_FEATURES = ['bhk', 'area_per_sqft', 'rate_per_sqft', 'connectivity_score', 'lat', 'lon']
CATEGORICAL_FEATURES = ['property_type', 'locality_raw', 'geo_cluster']
FEATURE_NAMES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def _preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ('numeric', StandardScaler(), NUMERIC_FEATURES),
        ('categorical', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES),
    ])


def _candidates() -> dict:
    candidates = {
        'RandomForest': RandomForestRegressor(n_estimators=100, min_samples_leaf=2, random_state=42, n_jobs=-1),
        'GradientBoosting': GradientBoostingRegressor(n_estimators=90, learning_rate=.04, max_depth=3, random_state=42),
    }
    try:
        from xgboost import XGBRegressor
        candidates['XGBoost'] = XGBRegressor(n_estimators=450, max_depth=6, learning_rate=.04, subsample=.85,
                                               colsample_bytree=.85, objective='reg:squarederror', random_state=42,
                                               n_jobs=1, tree_method='hist')
    except ImportError:
        pass
    try:
        from lightgbm import LGBMRegressor
        candidates['LightGBM'] = LGBMRegressor(n_estimators=450, learning_rate=.04, num_leaves=31,
                                                random_state=42, verbosity=-1)
    except ImportError:
        pass
    try:
        from catboost import CatBoostRegressor
        candidates['CatBoost'] = CatBoostRegressor(iterations=450, depth=7, learning_rate=.04, random_seed=42, verbose=False)
    except ImportError:
        pass
    return candidates


def _metrics(y_true, y_pred) -> dict:
    return {
        'mae_inr': round(float(mean_absolute_error(y_true, y_pred)), 2),
        'mape_pct': round(float(mean_absolute_percentage_error(y_true, y_pred) * 100), 3),
        'r2': round(float(r2_score(y_true, y_pred)), 5),
    }


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    aliases = {'area per sqft': 'area_per_sqft', 'rate per sqft': 'rate_per_sqft'}
    df = df.rename(columns={k: v for k, v in aliases.items() if k in df.columns}).copy()
    required = set(FEATURE_NAMES + ['price'])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f'Dataset is missing required columns: {sorted(missing)}')
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(df[col].median())
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna('unknown').astype(str)
    raw_price = pd.to_numeric(df['price'], errors='coerce')
    # The supplied Ahmedabad data stores price in crore.  Values already in
    # INR are retained to make the trainer safe for a future normalized export.
    df['target_price_inr'] = np.where(raw_price < 1_000, raw_price * 10_000_000, raw_price)
    return df.dropna(subset=['target_price_inr'])


def _locality_lookup(df: pd.DataFrame) -> dict:
    stats = df.groupby('locality_raw').agg(
        avg_rate_per_sqft=('rate_per_sqft', 'median'), avg_connectivity=('connectivity_score', 'mean'),
        lat=('lat', 'mean'), lon=('lon', 'mean'), geo_cluster=('geo_cluster', lambda x: str(x.mode().iloc[0])),
        listings=('target_price_inr', 'size'),
    )
    return {str(index).lower(): {key: (float(value) if isinstance(value, (float, np.floating, int, np.integer)) else value)
                                 for key, value in row.items()}
            for index, row in stats.iterrows()}


def main(data_path: str | Path = DATA_PATH, model_out: str | Path = MODEL_OUT, metrics_out: str | Path = METRICS_OUT):
    df = _normalise(pd.read_csv(data_path))
    # Keeps the model-selection cycle practical on the large scraped export;
    # the final chosen estimator is still fitted on every supplied row.
    selection_df = df.sample(n=min(len(df), 5000), random_state=42) if len(df) > 5000 else df
    X, y = selection_df[FEATURE_NAMES], selection_df['target_price_inr']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, random_state=42)
    cv = KFold(n_splits=3, shuffle=True, random_state=42)
    report, fitted = {}, {}
    for name, estimator in _candidates().items():
        pipeline = Pipeline([('prep', _preprocessor()), ('model', estimator)])
        started = time.time()
        scores = cross_validate(pipeline, X_train, y_train, cv=cv,
                                scoring={'mae': 'neg_mean_absolute_error', 'r2': 'r2'}, n_jobs=1)
        pipeline.fit(X_train, y_train)
        report[name] = {
            'cv_mae_inr': round(float(-scores['test_mae'].mean()), 2),
            'cv_r2': round(float(scores['test_r2'].mean()), 5),
            **_metrics(y_test, pipeline.predict(X_test)),
            'seconds': round(time.time() - started, 2),
        }
        fitted[name] = pipeline
    best_name = min(report, key=lambda name: report[name]['cv_mae_inr'])
    # Tune the selected family with a deterministic search instead of assuming
    # one library will always win on a future data refresh.
    params = ({'model__n_estimators': [80, 120, 160], 'model__max_depth': [None, 12, 20], 'model__min_samples_leaf': [1, 2, 4]}
              if best_name == 'RandomForest' else
              {'model__n_estimators': [150, 250, 400], 'model__learning_rate': [.02, .04, .07], 'model__max_depth': [2, 3, 4]})
    search = RandomizedSearchCV(Pipeline([('prep', _preprocessor()), ('model', _candidates()[best_name])]), params,
                                n_iter=min(3, np.prod([len(x) for x in params.values()])), scoring='neg_mean_absolute_error',
                                cv=cv, random_state=42, n_jobs=1)
    search.fit(X_train, y_train)
    tuned_metrics = _metrics(y_test, search.best_estimator_.predict(X_test))
    final_model = search.best_estimator_.fit(df[FEATURE_NAMES], df['target_price_inr'])
    model_out, metrics_out = Path(model_out), Path(metrics_out)
    model_out.parent.mkdir(parents=True, exist_ok=True)
    metrics_out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({'artifact_version': 2, 'pipeline': final_model, 'model_name': f'{best_name} (tuned)',
                 'feature_names': FEATURE_NAMES, 'locality_lookup': _locality_lookup(df),
                 'defaults': {col: float(df[col].median()) for col in NUMERIC_FEATURES},
                 'training_contract': {'excluded_columns': ['dist_school_km', 'dist_hospital_km', 'dist_bank_km', 'dist_transit_km', 'dist_rail_km'],
                                       'amenities_used_for_training': False}}, model_out)
    output = {'candidates': report, 'selected_before_tuning': best_name, 'tuned_test': tuned_metrics,
              'deployed_model': f'{best_name} (tuned)', 'feature_names': FEATURE_NAMES}
    metrics_out.write_text(json.dumps(output, indent=2), encoding='utf-8')
    return output


if __name__ == '__main__':
    print(json.dumps(main(), indent=2))
