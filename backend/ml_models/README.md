# ml_models/
# ==========
# This directory stores the deployed price model and its validation report.
#
# Run `python backend/ml_models/train_ahmedabad_model.py` to compare available
# regressors with cross-validation, tune the winner, and write:
#
# - `price_model.joblib` — the versioned pipeline used by the API
# - `model_comparison.json` — model-selection metrics
#
# Training only uses `property_type`, `bhk`, `area_per_sqft`, `rate_per_sqft`,
# `connectivity_score`, `locality_raw`, `geo_cluster`, `lat`, and `lon`.
# Raw POI distances and amenities are intentionally excluded.
