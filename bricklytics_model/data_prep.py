"""
data_prep.py
--------------------------------------------------------------------
Loads the raw scraped property dataset and turns it into a clean,
model-ready table.

What the raw file actually contains (verified by inspection):
    lat, lon, bhk, rate per sqft, area per sqft, price,
    property name, location, nearby school, nearby hospital,
    nearby bank, nearby public transport, nearby railway station,
    price source, matched map name, matched from, match method,
    property type

Important finding: price (in Cr) = rate_per_sqft * area_per_sqft / 1e7
almost exactly for ~93% of rows. The ~7% that don't match are treated
as unreliable and dropped. This also tells us the *real* modelling
target is RATE PER SQFT, not price -- price is just rate x area, and
area is something the user supplies at prediction time (from the
listing form). Predict the rate, multiply by the user's area, and
you get a price that is internally consistent with the form.

None of the "amenities" fields used in the listing form (gym,
clubhouse, security, swimming pool, etc.) exist in this dataset, so
they CANNOT be learned. They are handled separately as a rule-based
premium layer (see amenity_scoring.py) -- this file only prepares
what can legitimately be trained on: location, size, configuration,
and proximity to school/hospital/bank/transit/rail.
"""

import re
import numpy as np
import pandas as pd

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Point this at wherever your raw scraped CSV lives. Defaults to the path
# used during development; override with the RAW_DATA_PATH env var if needed.
RAW_PATH = os.environ.get(
    "RAW_DATA_PATH",
    "/mnt/user-data/uploads/property_location_amenities_with_type.csv",
)

DIST_COLS = {
    "nearby school": "dist_school_km",
    "nearby hospital": "dist_hospital_km",
    "nearby bank": "dist_bank_km",
    "nearby public transport": "dist_transit_km",
    "nearby railway station": "dist_rail_km",
}

# City-wide fallback used when a distance can't be parsed (missing name etc.)
# -> use the column median, computed after parsing (see below).


def _extract_km(text: str) -> float:
    """Pull the '(x.xx km)' distance out of a free-text nearby-POI string."""
    if not isinstance(text, str):
        return np.nan
    m = re.search(r"\(([\d.]+)\s*km\)", text)
    return float(m.group(1)) if m else np.nan


def load_raw() -> pd.DataFrame:
    return pd.read_csv(RAW_PATH)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # --- 1. internal-consistency check: price should equal rate*area/1e7 ---
    implied_price = df["rate per sqft"] * df["area per sqft"] / 1e7
    pct_diff = (implied_price - df["price"]).abs() / df["price"].replace(0, np.nan)
    df = df[pct_diff <= 0.01].copy()  # keep only internally-consistent rows

    # --- 2. drop physically-impossible / data-entry-error outliers ---
    # Bounds set from the Ahmedabad market distribution (1st-99th pct with
    # a sanity margin), not arbitrary round numbers.
    df = df[
        df["rate per sqft"].between(1200, 45000)
        & df["area per sqft"].between(150, 12000)
        & df["price"].between(0.05, 25)
        & df["bhk"].between(1, 8)
    ].copy()

    # --- 3. parse proximity fields into numeric km ---
    for src, dst in DIST_COLS.items():
        df[dst] = df[src].apply(_extract_km)
        median = df[dst].median()
        df[dst] = df[dst].fillna(median)
        # clip absurd geocoding mismatches
        df[dst] = df[dst].clip(0, 30)

    # --- 4. normalise property type ---
    df["property_type"] = df["property type"].str.strip().str.lower()
    df = df[df["property_type"].isin(["flat", "house", "floor", "land"])]

    # --- 5. drop rows with no usable location text at all ---
    df["locality_raw"] = df["matched map name"].fillna(df["location"])
    df = df.dropna(subset=["locality_raw", "lat", "lon"])

    # --- 6. engineered features ---
    df["log_rate"] = np.log(df["rate per sqft"])
    df["log_area"] = np.log(df["area per sqft"])

    # simple inverse-distance connectivity score (0-100, higher = better served)
    # each amenity's contribution decays with distance; weights reflect how
    # much each proximity typically matters to a buyer in this market.
    weights = {
        "dist_school_km": 0.20,
        "dist_hospital_km": 0.20,
        "dist_bank_km": 0.10,
        "dist_transit_km": 0.30,
        "dist_rail_km": 0.20,
    }
    score = np.zeros(len(df))
    for col, w in weights.items():
        # 0 km -> full marks, 5+ km -> ~0
        score += w * np.clip(1 - df[col] / 5.0, 0, 1)
    df["connectivity_score"] = (score * 100).round(1)

    keep_cols = [
        "lat", "lon", "bhk", "property_type",
        "area_per_sqft", "rate_per_sqft", "price",
        "log_area", "log_rate",
        "dist_school_km", "dist_hospital_km", "dist_bank_km",
        "dist_transit_km", "dist_rail_km", "connectivity_score",
        "locality_raw",
    ]
    df = df[keep_cols].rename(columns={
        "area per sqft": "area_per_sqft",
        "rate per sqft": "rate_per_sqft",
    }).reset_index(drop=True)
    return df


def build_locality_clusters(df: pd.DataFrame, n_clusters: int = 40):
    """
    The free-text locality field is too noisy/high-cardinality (1000+
    distinct strings, many one-off landmark names) to one-hot encode
    directly. Instead we cluster properties geographically (lat/lon)
    into micro-markets -- this captures "location, location, location"
    without overfitting to rare place-name strings, and it also becomes
    the unit the appreciation model operates on.
    """
    from sklearn.cluster import KMeans

    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df = df.copy()
    df["geo_cluster"] = km.fit_predict(df[["lat", "lon"]])
    return df, km


if __name__ == "__main__":
    raw = load_raw()
    print("raw shape:", raw.shape)
    clean_df = clean(raw)
    print("clean shape:", clean_df.shape, f"({len(clean_df)/len(raw):.1%} retained)")
    clean_df, kmeans_model = build_locality_clusters(clean_df)
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "models"), exist_ok=True)
    clean_df.to_csv(os.path.join(BASE_DIR, "data/clean_properties.csv"), index=False)
    import joblib
    joblib.dump(kmeans_model, os.path.join(BASE_DIR, "models/geo_cluster_kmeans.joblib"))
    print(clean_df.head())
    print(clean_df["geo_cluster"].value_counts().describe())
