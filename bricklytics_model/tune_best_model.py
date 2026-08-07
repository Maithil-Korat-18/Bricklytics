"""
tune_best_model.py
--------------------------------------------------------------------
XGBoost and LightGBM came out on top in the first comparison pass.
This does a randomized hyperparameter search over both (they're cheap
to fit) and keeps whichever tuned model wins on the held-out test set.
"""
import json
import time
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, KFold, RandomizedSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data/clean_properties.csv")
MODEL_OUT = os.path.join(BASE_DIR, "models/price_model.joblib")
METRICS_OUT = os.path.join(BASE_DIR, "reports/model_comparison.json")

NUMERIC_FEATURES = [
    "lat", "lon", "bhk", "log_area",
    "dist_school_km", "dist_hospital_km", "dist_bank_km",
    "dist_transit_km", "dist_rail_km", "connectivity_score",
]
CATEGORICAL_FEATURES = ["property_type", "geo_cluster"]
TARGET = "log_rate"


def build_preprocessor():
    return ColumnTransformer([
        ("num", StandardScaler(), NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])


def rate_space_metrics(y_true_log, y_pred_log):
    y_true, y_pred = np.exp(y_true_log), np.exp(y_pred_log)
    return {
        "rmse_rs_per_sqft": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 1),
        "mae_rs_per_sqft": round(float(mean_absolute_error(y_true, y_pred)), 1),
        "mape_pct": round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100), 2),
        "r2": round(float(r2_score(y_true, y_pred)), 4),
    }


def main():
    df = pd.read_csv(DATA_PATH)
    df["geo_cluster"] = df["geo_cluster"].astype(str)
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    cv = KFold(n_splits=3, shuffle=True, random_state=42)

    search_space = {
        "XGBoost": (
            XGBRegressor(random_state=42, n_jobs=1, tree_method="hist"),
            {
                "model__n_estimators": [300, 500, 700],
                "model__max_depth": [4, 5, 6, 7],
                "model__learning_rate": [0.02, 0.03, 0.05, 0.08],
                "model__subsample": [0.7, 0.8, 0.9, 1.0],
                "model__colsample_bytree": [0.6, 0.8, 1.0],
                "model__min_child_weight": [1, 3, 5],
                "model__reg_lambda": [0.5, 1.0, 2.0],
            },
        ),
        "LightGBM": (
            LGBMRegressor(random_state=42, verbosity=-1),
            {
                "model__n_estimators": [300, 500, 700],
                "model__num_leaves": [15, 31, 63],
                "model__learning_rate": [0.02, 0.03, 0.05, 0.08],
                "model__subsample": [0.7, 0.8, 0.9, 1.0],
                "model__colsample_bytree": [0.6, 0.8, 1.0],
                "model__min_child_samples": [5, 10, 20],
            },
        ),
    }

    tuned_results = {}
    best_estimators = {}

    for name, (model, params) in search_space.items():
        pipe = Pipeline([("prep", build_preprocessor()), ("model", model)])
        t0 = time.time()
        search = RandomizedSearchCV(
            pipe, params, n_iter=25, cv=cv, scoring="r2",
            random_state=42, n_jobs=1,
        )
        search.fit(X_train, y_train)
        y_pred_test = search.best_estimator_.predict(X_test)
        metrics = rate_space_metrics(y_test.values, y_pred_test)
        dt = round(time.time() - t0, 1)
        tuned_results[name] = {
            "best_cv_r2_logspace": round(search.best_score_, 4),
            **metrics,
            "best_params": search.best_params_,
            "seconds": dt,
        }
        best_estimators[name] = search.best_estimator_
        print(f"{name}: CV R2(log)={search.best_score_:.4f} | Test R2={metrics['r2']:.4f} "
              f"| MAPE={metrics['mape_pct']:.2f}% | RMSE=Rs{metrics['rmse_rs_per_sqft']:.0f}/sqft | {dt}s")

    best_name = max(tuned_results, key=lambda k: tuned_results[k]["r2"])
    print(f"\nBest tuned model: {best_name}")

    # refit best on ALL data for deployment
    final_pipe = best_estimators[best_name]
    final_pipe.fit(X, y)

    joblib.dump(
        {"pipeline": final_pipe, "model_name": f"{best_name} (tuned)",
         "numeric_features": NUMERIC_FEATURES, "categorical_features": CATEGORICAL_FEATURES,
         "target": TARGET},
        MODEL_OUT,
    )

    # merge into existing comparison report
    with open(METRICS_OUT) as f:
        report = json.load(f)
    report["tuned_results"] = tuned_results
    report["final_best_model"] = f"{best_name} (tuned)"
    with open(METRICS_OUT, "w") as f:
        json.dump(report, f, indent=2)

    print(f"Saved tuned model -> {MODEL_OUT}")


if __name__ == "__main__":
    main()
