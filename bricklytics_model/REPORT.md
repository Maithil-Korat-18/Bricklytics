# Bricklytics Price, Amenity, Appreciation & Investment Model

Trained on `property_location_amenities_with_type.csv` (16,580 Ahmedabad listings).
This document explains what was actually built, why it's built that way, the
accuracy you can expect, and how to wire it into the existing React form
(`Step1BasicInfo.jsx` / `Step2PropertyDetails.jsx`).

---

## 1. What the raw data actually contains

| Column | Notes |
|---|---|
| `lat`, `lon` | property coordinates |
| `bhk` | 1–45 (extreme values are data errors, filtered out) |
| `rate per sqft`, `area per sqft`, `price` | `price (Cr) = rate × area / 1e7` holds almost exactly |
| `property name`, `location`, `matched map name` | free-text, very high cardinality (6,768 / 1,008 distinct values) |
| `nearby school/hospital/bank/public transport/railway station` | free text with an embedded `(x.xx km)` distance |
| `property type` | flat / house / floor / land |

**None of the fields your form collects for amenities exist here** — no gym,
clubhouse, security, swimming pool, furnishing, floor number, property age,
or possession status anywhere in the file. That's a hard data ceiling, not
an oversight: a model can only learn a relationship if the column exists.
So the system below is split into two honest parts:

1. **A trained ML model** for everything the data *can* support: location,
   size, configuration, connectivity → predicted **rate per sqft**.
2. **A rule-based premium layer** for everything it *can't* (amenities, and
   appreciation-over-time), calibrated from real-estate market data instead
   of this dataset, and clearly labeled as such below.

Mixing these two without saying which is which would be misleading, so
every output in `predict.py` tells you which number came from which source.

---

## 2. Data cleaning

- Dropped rows where `price ≠ rate×area/1e7` (±1%) — 1,136 rows (6.9%), a
  data-entry-consistency check.
- Clipped to plausible Ahmedabad ranges: rate ₹1,200–45,000/sqft, area
  150–12,000 sqft, price ₹0.05–25 Cr, BHK 1–8. This removes rows like
  ₹1.5 crore-per-sqft or 6.5-million-sqft "flats" that are clearly typos.
- Parsed the `(x.xx km)` distance out of each free-text "nearby X" field.
- **14,609 of 16,580 rows kept (88.1%).**

## 3. Feature engineering

- **`connectivity_score`** (0–100): inverse-distance-weighted score across
  school/hospital/bank/transit/rail proximity — transit and rail weighted
  highest, bank lowest, based on how much each typically drives buyer
  decisions.
- **`geo_cluster`**: the free-text locality field is too noisy to encode
  directly (1,000+ distinct strings, many one-off landmark names), so
  properties are grouped into 40 geographic micro-markets via K-Means on
  lat/lon. This is also the unit the appreciation model operates on.
- Target is **`log(rate per sqft)`**, not price directly — since
  `price = rate × area` and area is something the user already knows at
  prediction time, predicting rate and multiplying by area gives a price
  that's internally consistent with whatever area the form has.

---

## 4. Model comparison (the "which model is best" question)

Six regressors were trained on an 80/20 split with 3-fold cross-validation,
scored in real ₹/sqft terms (converted back from log-space):

| Model | Test R² | MAPE | RMSE (₹/sqft) | Fit time |
|---|---|---|---|---|
| Linear Regression | 0.226 | 32.9% | 3,985 | 0.2s |
| Ridge | 0.227 | 32.9% | 3,983 | 0.1s |
| Random Forest | 0.473 | 27.6% | 3,290 | 50.6s |
| Gradient Boosting | 0.436 | 29.1% | 3,402 | 11.5s |
| XGBoost | 0.511 | 26.0% | 3,169 | 3.1s |
| LightGBM | 0.505 | 26.1% | 3,186 | 2.1s |
| **XGBoost (tuned)** | **0.521** | **25.8%** | **3,134** | 63.3s |

**Winner: XGBoost**, after a 25-iteration randomized hyperparameter search
(`n_estimators=500, max_depth=7, learning_rate=0.03, subsample=0.8,
colsample_bytree=0.6, reg_lambda=0.5`). It's saved to `models/price_model.joblib`
and refit on 100% of the cleaned data for deployment.

**Feature importance** (top drivers): `bhk`, `property_type`, and which
`geo_cluster` the property falls in dominate — together with
`connectivity_score` and `log_area`, they explain most of what the model
can explain.

### Be direct about the accuracy ceiling
R² ≈ 0.52 / MAPE ≈ 26% is a real, honest number for this feature set — it's
**not** a "high accuracy" model in the sense you might get on a dataset
with condition/floor/age/amenities included, and I don't want to oversell
it. Location, size and configuration alone typically explain roughly half
the price variance in residential real estate; the other half comes from
things this dataset simply doesn't record: unit condition, exact floor,
view, furnishing, actual (not generic) amenities, builder reputation, and
negotiation dynamics. **If you can add even 3–4 of those fields to future
scraped/listed data, expect a meaningful accuracy jump** — that's the
highest-leverage next step, well above trying more model architectures.

---

## 5. Amenity/facility weighting (`amenity_scoring.py`)

Since amenities have zero representation in the training data, they're
applied as a **rule-based % price premium on top of the ML base price**,
not learned. Weights are tiered by how much each amenity is generally
reported to matter to buyers in Indian gated-community pricing (safety and
signature lifestyle amenities weighted highest, convenience/sustainability
features lower), and the total is capped at **+16%** to reflect diminishing
returns — ticking every box doesn't mean paying double.

| Tier | Examples | Weight each |
|---|---|---|
| Safety & signature | Security, Swimming Pool, Clubhouse, CCTV, Fire Safety, Gym | 1.4 – 2.4% |
| Everyday/family | Garden, Children's Play Area, Parking, Terrace | 0.8 – 1.2% |
| Nice-to-have | Indoor Games, Intercom, Solar Power, Rain Water Harvesting | 0.3 – 0.7% |
| "Nearby X" checkboxes | School/Hospital/Metro/Mall/ATM | 0.2 – 0.7% (kept small — real proximity is already priced in via `connectivity_score`) |

**This is a starting point, not ground truth.** The moment you have real
transaction pairs (same locality/size, with vs. without a given amenity),
refit these as a proper hedonic regression with amenity dummies instead of
hand-set weights.

---

## 6. Appreciation model (`appreciation_model.py`) — read this carefully

The dataset is **one snapshot in time** — no purchase dates, no price
history. There is no time axis to learn an appreciation rate from, so a
genuinely *trained* forecasting model isn't possible on this data — any
tool claiming to "predict" appreciation from a snapshot like this would be
making it up. Instead, this builds a defensible **cross-sectional Growth
Potential Score (0–100)** per micro-market from signals correlated with
future appreciation in the real-estate literature:

- connectivity quality (30%)
- relative pricing position — the upper-mid price band scores highest, since
  very cheap areas often mean weak demand and very expensive areas are
  often already fully priced in (25%)
- new-development activity, proxied by % of listings that are flats (20%)
- listing volume / data confidence (10%)
- **+15 point bonus** for localities independently reported as high-growth
  corridors in 2025–2026 Ahmedabad market coverage (Cushman & Wakefield
  Ahmedabad MarketBeat Q1 2026; Prosperia Realty, Gruh Properties,
  99acres/Squareyards market reports) — Bodakdev, Prahlad Nagar, Sindhu
  Bhavan Road, SG Highway, South Bopal, Shela, Ambli, Gota, Thaltej,
  Science City.

The score is mapped to annual appreciation **ranges**, calibrated to what
those same reports observed (citywide average ~7–8%/yr, softening to ~3%/yr
in one recent quarter; named growth corridors ~8–15%/yr; premium mature
localities cited at 20–30% cumulative over ~2 years):

| Score | Band | Est. annual appreciation |
|---|---|---|
| 80–100 | High-growth corridor | 10.0 – 15.0% |
| 60–79 | Above-average growth | 7.5 – 10.5% |
| 40–59 | City-average growth | 5.5 – 8.0% |
| 20–39 | Stable / mature market | 3.5 – 6.0% |
| 0–19 | Slow / data-thin market | 2.0 – 4.5% |

Top-scoring micro-markets in this dataset: **South Bopal, Thaltej, Shilaj,
Gota, Shela** — all independently flagged as growth corridors in the
market research above, which is a reasonable sanity check on the scoring
logic. Full per-cluster table: `reports/locality_appreciation.json`.

**Treat this as a ranking tool for comparing localities against each
other, not a guaranteed return, and not financial advice.**

---

## 7. Investment score (`investment_score.py`)

Composite 0–100 score:

- **Value (30%)** — how the asking price compares to the model's fair-value
  prediction (skipped/reweighted if no asking price is given, e.g. for a
  brand-new listing still being priced)
- **Growth potential (30%)** — the locality's score from §6
- **Connectivity (20%)**
- **Amenity richness (10%)** — from §5
- **Liquidity (10%)** — how many comparable listings exist nearby

---

## 8. How to use it (`predict.py`)

```python
from predict import predict_listing

result = predict_listing(
    locality="South Bopal",          # or lat=..., lon=...
    property_type="flat",
    bhk=3,
    area_sqft=1450,
    amenities=["Security", "CCTV", "Clubhouse", "Gym", "Garden"],
    asking_price_cr=None,            # optional
)
```

Returns predicted rate/sqft, ML base price, amenity premium %, final
estimated price, locality appreciation band, and the full investment score
breakdown — see `predict.py`'s docstring for the exact shape.

An optional FastAPI wrapper (`api.py`) exposes this as `POST /predict` so
your existing Node.js backend (`propertyApi.js`) can call it as a
microservice rather than reimplementing anything in JS:

```bash
pip install -r requirements.txt
uvicorn api:app --port 8000
```

```js
const res = await axios.post('http://localhost:8000/predict', {
  locality: form.locality,
  property_type: form.propertyType,
  bhk: Number(form.bhk),
  area_sqft: Number(form.carpetArea),
  amenities: form.amenities,
  asking_price_cr: form.price ?? null,
});
```

---

## 9. File map

```
data_prep.py          clean the raw CSV, engineer features, build geo clusters
train_model.py         compare 6 regressors, save the best
tune_best_model.py      hyperparameter-search the top 2, save the final model
amenity_scoring.py      rule-based amenity premium weights
appreciation_model.py   locality Growth Potential Score + appreciation bands
investment_score.py     composite investment score
predict.py               single entry point tying it all together
api.py                    optional FastAPI wrapper for the Node backend
models/price_model.joblib          trained XGBoost pipeline (preprocessing + model)
models/geo_cluster_kmeans.joblib   the 40-cluster K-Means model
data/clean_properties.csv          cleaned, feature-engineered training data
reports/model_comparison.json       full metrics for all 6 models
reports/locality_appreciation.json   per-cluster growth scores & bands
```

## 10. Honest next steps to actually raise accuracy

In priority order:
1. Start recording real amenity flags, floor number, property age, and
   furnishing status against listings going forward — even a few hundred
   labeled rows would let the amenity weights move from rule-based to
   learned, and would likely do more for accuracy than any model swap.
2. Same for transaction dates — that's what would let the appreciation
   model go from a cross-sectional proxy to an actual trained forecast.
3. Once those exist, re-run `train_model.py` — the pipeline doesn't change,
   just point it at the richer table.
