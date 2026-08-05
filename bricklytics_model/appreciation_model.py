"""
appreciation_model.py
--------------------------------------------------------------------
IMPORTANT — read this before trusting these numbers:
The dataset is a SINGLE SNAPSHOT (one row per property, no purchase
date, no price history). There is no time axis to learn from, so it
is not possible to *train* a real appreciation-forecasting model on
this data — any tool that claims to do so on a snapshot like this
would be fabricating a capability the data can't support.

What this module actually does instead: it builds a cross-sectional
"Growth Potential Score" per micro-market (geo_cluster) from signals
that correlate with future appreciation in the academic/industry
real-estate literature --
  - infrastructure/connectivity quality (proxy: connectivity_score)
  - relative pricing position (very cheap areas can mean stagnant/low
    demand; very expensive areas are often already fully priced in;
    the sweet spot for forward appreciation is normally the upper-mid
    band -- good enough demand, still room to re-rate)
  - new-supply / development activity (proxy: % of listings that are
    flats, a rough stand-in for organised new development vs static
    old housing stock)
  - liquidity / data confidence (number of listings observed)
  - a small named-corridor adjustment for localities independently
    reported as high-growth corridors in 2025-2026 Ahmedabad market
    research (Cushman & Wakefield Ahmedabad MarketBeat Q1 2026;
    Prosperia Realty and 99acres/Squareyards/Gruh Properties market
    reports) -- Bodakdev, Prahlad Nagar, Sindhu Bhavan Road, SG
    Highway, South Bopal, Shela, Ambli, Gota, Thaltej, Science City.

The 0-100 score is then mapped onto annual appreciation BANDS that
are calibrated to what those same reports observed city-wide
(~7-8%/yr citywide average, ~3%/yr in a softer recent quarter) and
in named growth corridors (~8-15%/yr, occasionally higher over short
windows). Treat the output as an estimate/range for ranking
localities against each other, not a guaranteed return -- and it is
not financial advice.
"""
import numpy as np
import pandas as pd
import json

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data/clean_properties.csv")
OUT_TABLE = os.path.join(BASE_DIR, "reports/locality_appreciation.json")

GROWTH_CORRIDOR_LOCALITIES = {
    "bodakdev", "prahlad nagar", "sindhu bhavan", "sg highway",
    "south bopal", "bopal", "shela", "ambli", "gota", "thaltej",
    "science city",
}

# (score_lower_bound, low_pct, high_pct, label)
APPRECIATION_BANDS = [
    (80, 10.0, 15.0, "High-growth corridor"),
    (60, 7.5, 10.5, "Above-average growth"),
    (40, 5.5, 8.0, "City-average growth"),
    (20, 3.5, 6.0, "Stable / mature market"),
    (0, 2.0, 4.5, "Slow / data-thin market"),
]


def _tag_corridor(locality_text: str) -> bool:
    t = str(locality_text).lower()
    return any(name in t for name in GROWTH_CORRIDOR_LOCALITIES)


def build_locality_table() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)

    agg = df.groupby("geo_cluster").agg(
        avg_rate=("rate per sqft", "mean"),
        median_rate=("rate per sqft", "median"),
        n_listings=("rate per sqft", "size"),
        avg_connectivity=("connectivity_score", "mean"),
        pct_flat=("property_type", lambda s: (s == "flat").mean()),
        lat=("lat", "mean"),
        lon=("lon", "mean"),
        dist_school_km=("dist_school_km", "mean"),
        dist_hospital_km=("dist_hospital_km", "mean"),
        dist_bank_km=("dist_bank_km", "mean"),
        dist_transit_km=("dist_transit_km", "mean"),
        dist_rail_km=("dist_rail_km", "mean"),
    ).reset_index()

    # representative locality name = most frequent raw string in the cluster
    rep_names = (
        df.groupby("geo_cluster")["locality_raw"]
        .agg(lambda s: s.value_counts().idxmax())
        .rename("representative_locality")
    )
    agg = agg.merge(rep_names, on="geo_cluster")

    # all distinct raw names seen in the cluster, for corridor tagging
    all_names = df.groupby("geo_cluster")["locality_raw"].apply(
        lambda s: " | ".join(s.dropna().unique()[:15])
    )
    agg["corridor_tag"] = agg["geo_cluster"].map(all_names).apply(_tag_corridor)

    # --- component scores, each 0-100 ---
    # relative pricing: sweet-spot scoring peaks around the 60-80th percentile
    price_pctile = agg["avg_rate"].rank(pct=True) * 100
    price_component = 100 - (price_pctile - 70).abs() * (100 / 70)
    price_component = price_component.clip(0, 100)

    connectivity_component = agg["avg_connectivity"].clip(0, 100)

    supply_component = (agg["pct_flat"] * 100).clip(0, 100)

    liquidity_component = (
        np.log1p(agg["n_listings"]) / np.log1p(agg["n_listings"].max()) * 100
    ).clip(0, 100)

    corridor_bonus = agg["corridor_tag"].map({True: 15, False: 0})

    growth_score = (
        0.30 * connectivity_component
        + 0.25 * price_component
        + 0.20 * supply_component
        + 0.10 * liquidity_component
        + corridor_bonus
    ).clip(0, 100).round(1)

    agg["growth_score"] = growth_score

    def band_for(score):
        for lower, lo, hi, label in APPRECIATION_BANDS:
            if score >= lower:
                return lo, hi, label
        return APPRECIATION_BANDS[-1][1:]

    bands = agg["growth_score"].apply(band_for)
    agg["appreciation_low_pct"] = bands.apply(lambda t: t[0])
    agg["appreciation_high_pct"] = bands.apply(lambda t: t[1])
    agg["appreciation_tier"] = bands.apply(lambda t: t[2])

    return agg.sort_values("growth_score", ascending=False).reset_index(drop=True)


if __name__ == "__main__":
    table = build_locality_table()
    cols = ["geo_cluster", "representative_locality", "n_listings", "avg_rate",
            "avg_connectivity", "corridor_tag", "growth_score",
            "appreciation_low_pct", "appreciation_high_pct", "appreciation_tier"]
    print(table[cols].to_string(index=False))
    table.to_json(OUT_TABLE, orient="records", indent=2)
    print(f"\nSaved -> {OUT_TABLE}")
