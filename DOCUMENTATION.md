# Bricklytics Project Master Documentation

This document serves as the comprehensive, authoritative single reference for the **Bricklytics** AI-driven real estate platform. It details the complete technology stack, underlying architecture, data schemas, mathematical formulas and algorithms, and end-to-end workflows for both Buyers and Sellers.

---

## 1. Project Overview & Architectural Philosophy

**Bricklytics** is an end-to-end AI-powered real estate intelligence and property marketplace platform tailored for the Indian real estate market, with primary calibration for Ahmedabad properties. 

### Key Goals
1. **Unbiased Valuation:** Provide sellers and buyers with an objective, machine-learning-driven fair market price that eliminates human speculation and target leakage.
2. **Deterministic Resale & Amenity Adjustments:** Separate base geographical/physical valuation from physical age degradation, reconstruction status, and physical amenities.
3. **Investment Intelligence:** Provide clear investment scores (out of 100) and multi-year compound appreciation projections (1-year, 3-year, 5-year) based on locality historical growth rates.
4. **Seamless Buyer & Seller Workflows:** Offer full property management, analytics, wishlist management, side-by-side property comparison (up to 12 properties), and visit scheduling with live messaging.

---

## 2. Technology Stack & Key Dependencies ("What We Are Using & Why")

### Backend Architecture (`backend/`)

| Technology / Library | Version / Tool | Purpose & Justification |
| :--- | :--- | :--- |
| **Python** | `3.10+` | Primary backend language, providing native compatibility with ML ecosystems (`scikit-learn`, `xgboost`, `pandas`). |
| **Django & Django REST Framework (DRF)** | `5.0+` / `3.14+` | Enterprise web framework providing secure API routing, serializer data validation, middleware, and management CLI commands. |
| **PyMongo & MongoEngine** | `0.28+` / `4.8+` | Document-oriented ORM/ODM connecting to MongoDB. Chosen over relational SQL to effortlessly handle flexible, deeply nested property schemas, image lists, prediction logs, and dynamic amenities. |
| **SimpleJWT (`rest_framework_simplejwt`)** | `5.3+` | Stateless authentication via JWT (JSON Web Tokens) with role claims (`buyer`, `seller`, `admin`). |
| **Joblib** | `1.3+` | Serializes and loads trained machine learning model pipelines (`price_model.joblib` and `preprocessor.joblib`) with low memory overhead. |
| **NumPy & Pandas** | `1.26+` / `2.1+` | High-performance numerical computations and data manipulation for ML feature preparation and inverse log transformations. |
| **Pytest & Pytest-Django** | `8.0+` | Automated testing framework for regression testing backend models, services, and API endpoints. |

### Frontend Architecture (`frontend/`)

| Technology / Library | Version / Tool | Purpose & Justification |
| :--- | :--- | :--- |
| **React** | `18.2+` | Declarative UI framework providing component reusability, virtual DOM performance, and responsive state management. |
| **Vite** | `5.1+` | Next-generation frontend tooling providing lightning-fast HMR (Hot Module Replacement) and optimized production bundling. |
| **Tailwind CSS** | `3.4+` | Utility-first CSS framework enabling a custom design system with rich glassmorphism, fluid typography, dark mode, and custom color tokens. |
| **Lucide React** | `0.344+` | Modern, clean vector iconography for UI touchpoints across dashboards, cards, and comparison views. |
| **Recharts** | `2.12+` | Composability-driven chart library for rendering seller analytics (views, inquiries, price comparisons, and investment distributions). |
| **React Router DOM** | `6.22+` | Client-side routing with route guards for authenticated buyer/seller views. |
| **Axios** | `1.6+` | Promise-based HTTP client for seamless REST API interactions with JWT authorization interceptors. |

### Machine Learning Stack (`bricklytics_model/`)

| Technology / Library | Purpose & Justification |
| :--- | :--- |
| **XGBoost Regressor (v5)** | Monotonic-constrained gradient boosting model selected as production winner ($R^2 = 0.7384$, 0 monotonicity violations). |
| **LightGBM & CatBoost** | Benchmarking candidate models evaluated for monotonicity and scale error. |
| **Scikit-Learn (`ColumnTransformer`, `StandardScaler`, `OneHotEncoder`)** | Feature normalization and categorical encodings. |
| **FastAPI (`api.py`)** | Lightweight microservice wrapper for independent model inference testing. |

---

## 3. Data Schemas & Model Contracts

### Strict 5-Feature ML Contract
To prevent target leakage (e.g., asking price or per-sqft rate influencing prediction), model training and inference consume strictly 5 inputs:
1. `area_sqft` — Carpet / Built-up area in square feet.
2. `bhk` — Number of bedrooms (1 to 10).
3. `property_type` — Normalized string (`Apartment` or `Villa`).
4. `latitude` — Geographical latitude within Ahmedabad bounds ($20.0 - 26.0$).
5. `longitude` — Geographical longitude within Ahmedabad bounds ($70.0 - 75.0$).

### Key MongoDB Collections (MongoEngine Documents)

#### 1. User Document (`accounts.models.User`)
* `email` (String, unique, indexed)
* `password_hash` (String, Django PBKDF2 hash)
* `full_name` (String)
* `role` (String: `'buyer'`, `'seller'`, `'admin'`)
* `phone` (String, optional)
* `created_at` (DateTimeField)

#### 2. Property Document (`seller.models.Property`)
* `seller_id` (String, indexed)
* `title` (String), `description` (String)
* `property_type` (String: `'flat'`, `'villa'`, `'house'`, `'plot'`)
* `listing_type` (String: `'new'`, `'resale'`)
* `price` / `expectedPrice` (Float, seller asking price)
* `carpetArea` / `area_sqft` (Float)
* `bhk` (Int), `bathrooms` (Int), `balconies` (Int)
* `property_age` (Int), `reconstruction_needed` (String)
* `address` (String), `locality` (String), `latitude` (Float), `longitude` (Float)
* `status` (String: `'active'`, `'draft'`, `'sold'`)
* `amenities` (List of EmbeddedDocument `PropertyAmenity`)
* `images` (List of EmbeddedDocument `PropertyImage`)
* `predictions` (List of EmbeddedDocument `PredictionHistory`)
* `view_count` (Int, default 0), `inquiry_count` (Int, default 0)

#### 3. VisitSchedule Document (`buyer.models.VisitSchedule`)
* `user_id` (String, buyer ID)
* `seller_id` (String, seller ID)
* `property_id` (String)
* `property_title` (String)
* `buyer_name` (String), `buyer_phone` (String), `buyer_email` (String)
* `preferred_date` (String: `YYYY-MM-DD`)
* `preferred_slot` (String: `'Morning (9 AM - 12 PM)'`, `'Afternoon (12 PM - 4 PM)'`, `'Evening (4 PM - 7 PM)'`)
* `request_type` (String: `'visit'`, `'inquiry'`)
* `status` (String: `'pending'`, `'confirmed'`, `'cancelled'`)
* `messages` (List of EmbeddedDocument `InquiryMessage`)

#### 4. PropertyCompare Document (`buyer.models.PropertyCompare`)
* `user_id` (String, unique)
* `property_ids` (List of String IDs, max 12)
* `updated_at` (DateTimeField)

---

## 4. Calculations, Formulas & Core Logic ("Every Calculation & Logic")

### Calculation 1: Base Machine Learning Price Prediction (Log-Space Target)

The model predicts target price in log-space ($\log(1 + y)$) to eliminate scale skew across property value segments (budget vs. luxury).

1. **Input Normalization:** Categorical `property_type` is One-Hot encoded; numeric features (`area_sqft`, `bhk`, `lat`, `lon`) are standardized.
2. **Forward Inference:** 
   $$\hat{y}_{\text{log}} = f_{\text{XGBoost}}(\text{area\_sqft}, \text{bhk}, \text{lat}, \text{lon}, \text{property\_type})$$
3. **Inverse Log Transformation:**
   $$\text{Base ML Price} = \exp(\hat{y}_{\text{log}}) - 1$$
4. **Boundary Guard:**
   $$\text{Base ML Price} = \max(100\,000.0, \text{Base ML Price})$$

---

### Calculation 2: Resale Property Value Adjustment Engine

If the listing is a **Resale Property**, adjustments are applied to the Base ML Price based on property age and renovation requirements:

$$\text{Total Adjustment \%} = \text{Age Adjustment \%} + \text{Renovation Adjustment \%}$$

$$\text{Final Suggested Price} = \max\left(50\,000.0, \text{Base ML Price} \times \left(1 + \frac{\text{Total Adjustment \%}}{100}\right)\right)$$

#### Resale Rules Breakdown (`config/resale_rules.json`):

* **Property Age Rules:**
  * $0 \text{ to } 2 \text{ years: } 0.0\%$
  * $3 \text{ to } 5 \text{ years: } -3.0\%$
  * $6 \text{ to } 10 \text{ years: } -7.0\%$
  * $11 \text{ to } 15 \text{ years: } -12.0\%$
  * $> 15 \text{ years: } -18.0\%$

* **Renovation Status Rules:**
  * `'newly renovated'`: $+6.0\%$
  * `'major renovation'`: $+3.0\%$
  * `'minor renovation'`: $0.0\%$
  * `'never renovated'`: $-3.0\%$
  * `'requires reconstruction'`: $-8.0\%$

*If `listing_type` is `'New Property'`, Total Adjustment % is $0.0\%$, and Final Suggested Price = Base ML Price.*

---

### Calculation 3: Rule-Based Amenity Valuation Engine (`facility_adjustment_service.py`)

Physical amenities are intentionally excluded from ML training to prevent bias. They are calculated using transparent fixed values (in INR):

$$\text{Amenity Adjustment Amount} = \sum_{a \in \text{Selected Amenities}} \text{FixedValue}(a)$$

$$\text{Amenity Score (0 - 100\%)} = \frac{\text{Amenity Adjustment Amount}}{\sum_{all} \text{FixedValue}(all)} \times 100$$

$$\text{Final Price with Amenities} = \text{Base ML Price} + \text{Amenity Adjustment Amount}$$

#### Configured Amenity Fixed Values (INR):
* **Swimming Pool / Private Parking:** ₹300,000
* **Parking / Clubhouse:** ₹250,000
* **Private Lawn:** ₹200,000
* **Gym / Solar Power:** ₹175,000
* **Security:** ₹150,000
* **Lift / Garden:** ₹125,000
* **Terrace:** ₹120,000
* **Power Backup / Children Play Area / Children Park:** ₹100,000
* **CCTV / Rain Water Harvesting / Fire Safety / Visitor Parking / Jogging Track:** ₹75,000 – ₹80,000
* **Indoor Games / Intercom / Community Temple:** ₹30,000 – ₹60,000

---

### Calculation 4: Locality-Based Compound Appreciation Engine (`appreciation_service.py`)

Appreciation is computed strictly from historical annual growth rates ($r$) assigned to specific Ahmedabad micro-markets:

```
Appreciation Rate Table (r):
- Sindhu Bhavan: 7.0%      - SG Highway: 6.8%        - Science City: 6.6%
- Ambli: 6.5%              - Bopal: 6.4%             - Shela: 6.2%
- Shilaj: 6.1%             - Vaishnodevi Circle: 6.0%- South Bopal: 6.0%
- Gota: 5.8%               - Thaltej: 5.7%           - Bodakdev: 5.5%
- Prahlad Nagar: 5.4%      - Satellite: 5.2%         - Paldi: 5.0%
- Navrangpura: 4.6%        - Shahibaug: 4.5%         - Narol: 4.0%
- Vatva: 3.8%              - Bavla: 3.5%             - Changodar: 3.4%
- City Baseline Fallback: 5.2% (Adjusted by connectivity score)
```

#### Compound Appreciation Formula for $t \in \{1, 3, 5\}$ years:

$$\text{Future Price}(t) = \text{Asking Price} \times \left(1 + \frac{r}{100}\right)^t$$

$$\text{Total Growth Amount}(t) = \text{Future Price}(t) - \text{Asking Price}$$

$$\text{Growth Percentage}(t) = \left[\left(1 + \frac{r}{100}\right)^t - 1\right] \times 100\%$$

---

### Calculation 5: AI Investment Score & Rating Engine (`prediction_service.py`)

The AI Investment Score evaluates property health across 4 weighted components (Max Score capped strictly at 100):

$$\text{Composite Score} = 0.25 \times \text{Fairness} + 0.25 \times \text{Appreciation} + 0.25 \times \text{Location} + 0.25 \times \text{Profile}$$

$$\text{Investment Score} = \text{Round}\big(\text{Clamp}(40, 100, \text{Composite Score})\big)$$

#### 1. Price Fairness Score (25% Weight)
Compares Asking Price ($P_{\text{asking}}$) against AI Fair Price ($P_{\text{AI}}$):
$$\text{Diff \%} = \frac{P_{\text{asking}} - P_{\text{AI}}}{P_{\text{AI}}} \times 100$$
* If $\text{Diff \%} \le 0$ (Fair or Underpriced): $\text{Fairness Score} = \min(100.0, 86.0 + 1.2 \times |\text{Diff \%}|)$
* If $\text{Diff \%} > 0$ (Overpriced): $\text{Fairness Score} = \max(40.0, 82.0 - 1.8 \times \text{Diff \%})$

#### 2. Locality Appreciation Score (25% Weight)
$$\text{Appreciation Score} = \min\big(100.0, \max(50.0, 55.0 + (r - 5.0) \times 8.5)\big)$$

#### 3. Location Quality Score (25% Weight)
Uses `connectivity_score` if available; otherwise maps prime corridors (SG Highway, Science City, Bopal) to 88.0, mid-tier to 80.0, and outer to 72.0.

#### 4. Property Profile & Demand Score (25% Weight)
* Type Score: Villa/House = 88.0, Plot = 82.0, Apartment = 84.0
* BHK Score: 2-3 BHK = 88.0, 4+ BHK = 82.0, 1 BHK = 78.0
* Age Score: $\le 2$ yrs = 90.0, $\le 5$ yrs = 84.0, $\le 10$ yrs = 78.0, $>10$ yrs = 70.0
$$\text{Profile Score} = 0.4 \times \text{Type} + 0.4 \times \text{BHK} + 0.2 \times \text{Age}$$

#### Rating Tiers:
* **90 – 100:** Excellent
* **80 – 89:** Very Good
* **70 – 79:** Good
* **60 – 69:** Average
* **< 60:** Poor

---

### Calculation 6: Seller Dashboard Analytics Metrics (`AnalyticsPage.jsx`)

* **Total Active Listings Value:** $\sum_{i \in \text{Listings}} \text{Price}_i$
* **Total Portfolio Views:** $\sum_{i \in \text{Listings}} \text{view\_count}_i$
* **Total Inquiries:** $\sum_{i \in \text{Listings}} \text{inquiry\_count}_i$
* **Overall Portfolio Conversion Rate:** 
  $$\text{Conversion Rate \%} = \frac{\text{Total Inquiries}}{\text{Total Views}} \times 100$$
* **Overpriced Listing Alert Indicator:** Triggered if $\text{Asking Price} > 1.10 \times \text{AI Fair Price}$.

---

### Calculation 7: Compare Properties Metric Highlights (`ComparePropertiesPage.jsx`)

When comparing up to 12 properties side-by-side, the comparison engine calculates optimal badges:
* **Lowest Price Winner:** $\min(\text{price})$
* **Best Value Winner:** $\max\left(\frac{\text{AI Fair Price}}{\text{Asking Price}}\right)$
* **Highest Growth Winner:** $\max(\text{appreciation\_5yr})$
* **Largest Space Winner:** $\max(\text{carpetArea})$
* **Lowest Rate per Sqft Winner:** $\min\left(\frac{\text{Price}}{\text{carpetArea}}\right)$

---

## 5. End-to-End Buyer Workflow

```
[ Search & Filter Properties ]
             │
             ▼
[ Save Search Criteria (Optional) ]
             │
             ▼
[ View Property Detail Page ] ────► View AI Fair Price, Resale Breakdown, 
             │                     1/3/5 Year Projections & Investment Score
             ▼
[ Add to Compare Selection (Max 12) ] ────► Side-by-Side Comparison & Winners
             │
             ▼
[ Save to Wishlist ]
             │
             ▼
[ Schedule Visit / Request Contact ] ────► Pick Date & Time Slot (Morning/Afternoon/Evening)
                                           Send Inquiry Message to Seller
```

1. **Property Search & Filtering:** Buyers search properties by keyword, property type (flat/villa), price range, BHK, locality, and listing type (new vs resale).
2. **Saving Search Filters:** Buyers can save search criteria (e.g., "3 BHK in Bopal under 1 Cr") for fast execution later.
3. **Property Exploration & Valuation Inspection:** Buyers view detailed property listings, high-resolution media galleries, exact physical coordinates on map, and complete AI valuation breakdowns.
4. **Side-by-Side Comparison:** Buyers select up to 12 properties to compare simultaneously in a tabular format detailing specs, amenities, rate/sqft, and highlight badges.
5. **Wishlisting:** One-click wishlist toggling synced instantly to local state and database.
6. **Visit Scheduling & Direct Inquiry:** Buyers schedule in-person or virtual property visits by specifying preferred dates and time slots, attached with initial inquiry text messages.

---

## 6. End-to-End Seller Workflow

```
[ Post Property Listing ] ────► Input Specifications, Area, BHK, Location, Asking Price
             │
             ▼
[ Instant AI Valuation Engine ] ────► Generates Base ML Price, Resale Adjustments,
             │                        Amenity Values, Suggested Price & Score
             ▼
[ Manage Property Dashboard ] ────► View/Edit Listings, Change Status (Active/Draft/Sold)
             │
             ▼
[ Seller Analytics Suite ] ────────► Track Total Views, Inquiries, Conversion Rate %,
             │                        Overpriced Alerts & Market Position
             ▼
[ Manage Visits & Inquiries ] ────► Confirm/Cancel Visit Requests, Read & Reply to Messages
```

1. **Property Onboarding:** Sellers register property details including physical specifications, locality, location coordinates (lat/lon), asking price, property age, reconstruction status, and selected amenities.
2. **Automated AI Pricing Benchmark:** Upon saving, the system automatically triggers `PredictionService`, calculating the base ML value, applying age/renovation resale adjustments, adding amenity fixed values, and assigning an AI Investment Score.
3. **Inventory Management:** Sellers can modify property descriptions, update asking prices, upload image brochures, or change property status (`active`, `draft`, `sold`).
4. **Performance Analytics:** Sellers access an interactive analytics dashboard showing total portfolio value, view counts, inquiry rates, conversion rates, and pricing recommendation alerts (highlighting overpriced or underpriced listings).
5. **Visit & Inquiry Management:** Sellers receive buyer visit requests, accept/confirm or cancel appointments, and communicate directly through embedded messaging threads.

---

## 7. Machine Learning Model Training & Evaluation (`bricklytics_model`)

The ML pipeline was trained on **15,723 Ahmedabad properties** following a strict data cleaning protocol.

### Candidate Model Performance Comparison (v5 Benchmark):

| Model Architecture | R² Score | MAE (INR) | RMSE (INR) | MAPE (%) | Monotonicity Passed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **XGBoost Regressor (Winner)** | **0.7384** | **INR 4,022,738** | **INR 8,696,055** | **29.16%** | **PASSED (0 Violations)** |
| **LightGBM Regressor** | 0.7378 | INR 4,041,741 | INR 8,706,774 | 29.35% | **PASSED (0 Violations)** |
| **HistGradientBoosting** | 0.7344 | INR 4,047,414 | INR 8,763,233 | 29.08% | **PASSED (0 Violations)** |
| **CatBoost Regressor** | 0.6466 | INR 4,556,100 | INR 10,108,491 | 28.34% | **PASSED (0 Violations)** |
| **ExtraTrees Regressor** | 0.7558 | INR 3,749,297 | INR 8,403,176 | 27.24% | FAILED (3,388 Violations) |
| **RandomForest Regressor** | 0.7804 | INR 3,591,729 | INR 7,968,434 | 26.63% | FAILED (3,679 Violations) |

### Why Monotonicity Constraints Matter
Unconstrained models like RandomForest had high R² scores but frequently violated logical domain rules (e.g., predicting that increasing carpet area or BHK while holding location constant decreased price). XGBoost Regressor with strict positive monotonic constraints on `area_sqft` (+1) and `bhk` (+1) was promoted to production with **0 monotonicity violations**.

---

## 8. Summary of Main API Endpoints

### Authentication (`/api/accounts/`)
* `POST /api/accounts/register/` — Register new buyer or seller account.
* `POST /api/accounts/login/` — Login and obtain JWT tokens.
* `GET /api/accounts/profile/` — Get authenticated user details.

### Seller Properties (`/api/seller/properties/`)
* `GET /api/seller/properties/` — List properties owned by authenticated seller.
* `POST /api/seller/properties/` — Create new property (triggers AI predictions).
* `GET /api/seller/properties/<id>/` — Retrieve property details.
* `PUT /api/seller/properties/<id>/` — Update property listing.
* `DELETE /api/seller/properties/<id>/` — Delete property listing.
* `GET /api/seller/analytics/` — Retrieve seller portfolio analytics and charts.
* `GET /api/seller/visits/` — Retrieve visit requests submitted by buyers.
* `PATCH /api/seller/visits/<id>/` — Update visit status (`confirmed`/`cancelled`).

### Buyer Services (`/api/buyer/`)
* `GET /api/buyer/properties/` — Public active property listings search & filter.
* `GET /api/buyer/properties/<id>/` — Get property details with AI valuation.
* `GET /api/buyer/wishlist/` — Get buyer's saved wishlist.
* `POST /api/buyer/wishlist/toggle/` — Add or remove property from wishlist.
* `GET /api/buyer/compare/` — Get buyer's comparison property list.
* `POST /api/buyer/compare/add/` — Add property to comparison list (max 12).
* `POST /api/buyer/compare/remove/` — Remove property from comparison list.
* `POST /api/buyer/schedule-visit/` — Schedule a property visit & send inquiry message.
* `GET /api/buyer/visits/` — View buyer's scheduled visit requests.

---

## 9. Conclusion

The Bricklytics platform bridges machine learning precision with domain-specific property valuation rules. By separating physical features (ML core) from age/renovation penalties and amenity additions, Bricklytics provides sellers and buyers with an objective, institutional-grade valuation platform.
