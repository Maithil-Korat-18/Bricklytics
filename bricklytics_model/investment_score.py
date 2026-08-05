"""
investment_score.py
--------------------------------------------------------------------
Composite 0-100 "Investment Score" for a listing, combining:

  Value score (30%)        - is the asking price cheap or expensive
                              relative to the model's fair-value
                              prediction for a comparable property?
                              (skipped/reweighted if no asking price
                              is supplied -- e.g. a brand-new listing
                              still being priced)
  Growth potential (30%)   - the locality's Growth Potential Score
                              from appreciation_model.py
  Connectivity (20%)       - proximity to school/hospital/transit/rail
  Amenity richness (10%)   - weighted amenity score from
                              amenity_scoring.py
  Liquidity (10%)          - how many comparable listings exist in
                              that micro-market (more data = lower
                              pricing risk / easier resale)

This is a decision-support ranking tool, not financial advice --
it tells you how a listing stacks up against the rest of the
dataset on signals that plausibly matter, it does not guarantee
any return.
"""
from dataclasses import dataclass, field


@dataclass
class InvestmentScoreBreakdown:
    value_score: float | None
    growth_score: float
    connectivity_score: float
    amenity_score: float
    liquidity_score: float
    weights_used: dict
    investment_score: float
    label: str


def _label_for(score: float) -> str:
    if score >= 75:
        return "Strong investment candidate"
    if score >= 55:
        return "Good investment candidate"
    if score >= 35:
        return "Average / hold for end-use"
    return "Weak investment case"


def compute_investment_score(
    growth_score: float,
    connectivity_score: float,
    amenity_score: float,
    liquidity_score: float,
    predicted_fair_price: float,
    asking_price: float | None = None,
) -> InvestmentScoreBreakdown:

    value_score = None
    if asking_price and asking_price > 0:
        # cheaper than fair value -> higher score. +/-25% deviation maps to 0-100.
        deviation_pct = (predicted_fair_price - asking_price) / predicted_fair_price * 100
        value_score = 50 + deviation_pct * 2  # each 1% underpriced = +2 pts
        value_score = max(0.0, min(100.0, value_score))

    if value_score is not None:
        weights = {"value": 0.30, "growth": 0.30, "connectivity": 0.20,
                   "amenity": 0.10, "liquidity": 0.10}
        composite = (
            weights["value"] * value_score
            + weights["growth"] * growth_score
            + weights["connectivity"] * connectivity_score
            + weights["amenity"] * amenity_score
            + weights["liquidity"] * liquidity_score
        )
    else:
        # no asking price given -> redistribute the value weight
        weights = {"growth": 0.40, "connectivity": 0.30,
                   "amenity": 0.15, "liquidity": 0.15}
        composite = (
            weights["growth"] * growth_score
            + weights["connectivity"] * connectivity_score
            + weights["amenity"] * amenity_score
            + weights["liquidity"] * liquidity_score
        )

    composite = round(max(0.0, min(100.0, composite)), 1)

    return InvestmentScoreBreakdown(
        value_score=round(value_score, 1) if value_score is not None else None,
        growth_score=round(growth_score, 1),
        connectivity_score=round(connectivity_score, 1),
        amenity_score=round(amenity_score, 1),
        liquidity_score=round(liquidity_score, 1),
        weights_used=weights,
        investment_score=composite,
        label=_label_for(composite),
    )
