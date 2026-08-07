# Bricklytics AI Price Prediction Model Report (Model Version v5)

The Bricklytics AI Price Prediction machine learning pipeline has been upgraded to **Model Version v5**, trained on the cleaned dataset of 15,723 Ahmedabad properties.

This document details the architecture, multi-algorithm benchmark, data quality pipeline, log-space target transformation, monotonic constraints, and deployment integration.

---

## 1. Data Quality & Feature Contract Pipeline

### Strict 5-Feature Contract
To prevent target leakage and maintain strict domain boundaries, model training and inference exclusively consume 5 input features:
1. `area_sqft` (Carpet / Built-up area in sqft)
2. `bhk` (Number of Bedrooms)
3. `property_type` (Normalized to `Apartment` or `Villa`)
4. `latitude` (`lat`, within Ahmedabad bounds 20.0–26.0)
5. `longitude` (`lon`, within Ahmedabad bounds 70.0–75.0)

Strictly excluded: POI distances, connectivity scores, landmark text, rate per sqft, and target leakage fields.

### Data Cleaning Rules
- **Coordinates:** Filtered invalid coordinates outside Ahmedabad bounds (`lat`: 20.0–26.0, `lon`: 70.0–75.0).
- **Physical Corruptions:** Filtered out typos (`area_sqft` < 150 or > 15,000 sqft, `bhk` < 1 or > 10, `sqft_per_bhk` < 100 or > 5,000).
- **Price Range:** Retained legitimate properties up to ₹30 Crore (₹5 Lakhs to ₹300,000,000).

---

## 2. Multi-Algorithm Benchmarking & Evaluation Suite (v5)

Six candidate regression algorithms were trained on an 80/20 train-test split using log-space target transformation ($\log(1 + y)$), standardized scaling on numeric features, and One-Hot encoding on categorical property types.

### Model Performance Comparison

| Model Architecture | R² Score | MAE (INR) | RMSE (INR) | MAPE (%) | Mean Bias (INR) | Median % Error | Monotonicity Passed |
|---|---|---|---|---|---|---|---|
| **XGBoost Regressor (Selected Winner)** | **0.7384** | **INR 4,022,738** | **INR 8,696,055** | **29.16%** | **INR -888,902** | **19.85%** | **PASSED (0 Violations)** |
| **LightGBM Regressor** | 0.7378 | INR 4,041,741 | INR 8,706,774 | 29.35% | INR -934,897 | 19.70% | **PASSED (0 Violations)** |
| **HistGradientBoosting** | 0.7344 | INR 4,047,414 | INR 8,763,233 | 29.08% | INR -911,276 | 20.18% | **PASSED (0 Violations)** |
| **CatBoost Regressor** | 0.6466 | INR 4,556,100 | INR 10,108,491 | 28.34% | INR -3,206,689 | 21.71% | **PASSED (0 Violations)** |
| **ExtraTrees Regressor** | 0.7558 | INR 3,749,297 | INR 8,403,176 | 27.24% | INR -1,036,475 | 18.09% | FAILED (3,388 Violations) |
| **RandomForest Regressor** | 0.7804 | INR 3,591,729 | INR 7,968,434 | 26.63% | INR -836,071 | 17.01% | FAILED (3,679 Violations) |

---

## 3. Log-Space Target Transformation & Scale Skew Elimination

By transforming the target variable to log-space ($y_{\text{log}} = \log(1 + y_{\text{price\_inr}})$) and exponentiating back during inference ($\hat{y}_{\text{inr}} = \exp(\hat{y}_{\text{log}}) - 1$), the model eliminates scale skew across multi-segment property values.

### Segment-Wise Error Breakdown (XGBoost Regressor)

| Price Segment | Listing Count | MAE (INR) | MAPE (%) | Mean Prediction Bias (INR) |
|---|---|---|---|---|
| **Budget (< ₹50 Lakhs)** | 653 | INR 1,273,479 | 43.41% | +INR 995,018 |
| **Mid (₹50L – ₹1.5 Cr)** | 1,592 | INR 2,006,310 | 24.08% | +INR 464,043 |
| **High (₹1.5 Cr – ₹4 Cr)** | 697 | INR 6,376,919 | 27.11% | -INR 1,809,169 |
| **Luxury (> ₹4 Cr)** | 203 | INR 20,596,894 | 30.22% | -INR 14,399,547 |

---

## 4. Monotonicity Constraints & Automated Sanity Validation

### Monotonic Positive Constraints
Gradient boosting models (XGBoost, LightGBM, CatBoost, HistGradientBoosting) enforce strict positive monotonic constraints on `area_sqft` (+1) and `bhk` (+1):
- **Area Monotonicity:** Holding BHK, location, and property type constant, increasing `area_sqft` **must never decrease** predicted price.
- **BHK Monotonicity:** Holding area, location, and property type constant, increasing `bhk` **must never decrease** predicted price.

### Sanity Test Results
- **Area Monotonicity Test:** **PASSED (0 Violations across 9,720 test evaluations)**
- **BHK Monotonicity Test:** **PASSED (0 Violations across 9,720 test evaluations)**
- **Spatial Consistency Test:** **PASSED (Smooth spatial gradients across micro-markets)**

Non-monotonic ensemble models (RandomForest, ExtraTrees) were disqualified from production promotion due to 3,000+ monotonicity violations.

---

## 5. Artifact Versioning & Backend Integration

### Versioned Deployment (`v5`)
The winning **XGBoost Regressor (v5)** model was exported to versioned artifacts and promoted to active production pointers in both `bricklytics_model/` and `backend/ml_models/`:
- `price_model_v5.joblib` & `price_model.joblib`
- `preprocessor_v5.joblib` & `preprocessor.joblib`
- `model_metadata_v5.json` & `model_metadata.json`
- `model_comparison_v5.json`

### Public API & Service Contract
The Django backend `PredictionService` and standalone `predict.py` load `price_model.joblib` dynamically, process the strict 5-feature contract, handle log-space inverse transformation ($\exp(\hat{y}) - 1$), and output strictly **ONE** value: `AI Fair Price`.
