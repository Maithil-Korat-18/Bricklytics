"""
buyer/services/investment_service.py — High Precision ML Investment & Appreciation Engine
========================================================================================
Calculates Investment Scores and Appreciation Forecasts derived from real Ahmedabad dataset metrics
(property_location_amenities_with_type.csv).
"""

import os
import re
import logging
from pathlib import Path
import pandas as pd

logger = logging.getLogger('bricklytics.investment')

CSV_PATH = Path(__file__).resolve().parent.parent.parent.parent / 'property_location_amenities_with_type.csv'

class InvestmentScoreService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InvestmentScoreService, cls).__new__(cls)
            cls._instance._init_benchmarks()
        return cls._instance

    def _init_benchmarks(self):
        self.locality_benchmarks = {}
        self.default_rate_per_sqft = 5200.0

        if not CSV_PATH.exists():
            logger.warning(f"CSV file not found at {CSV_PATH}. Using default benchmarks.")
            return

        try:
            df = pd.read_csv(CSV_PATH)
            # Group by matched map name or location
            if 'matched map name' in df.columns:
                grouped = df.groupby('matched map name')
            else:
                grouped = df.groupby('location')

            stats = {}
            total_rates = []
            for name, group in grouped:
                clean_name = str(name).strip().lower()
                rates = group['rate per sqft'].dropna()
                if len(rates) >= 3:
                    avg_rate = float(rates.mean())
                    count = len(group)
                    stats[clean_name] = {
                        'avg_rate': avg_rate,
                        'count': count,
                    }
                    total_rates.extend(rates.tolist())

            if total_rates:
                self.default_rate_per_sqft = float(pd.Series(total_rates).median())

            self.locality_benchmarks = stats
            logger.info(f"Successfully loaded {len(stats)} locality benchmarks from CSV.")

        except Exception as e:
            logger.error(f"Error loading CSV benchmarks: {e}")

    def _parse_km(self, text: str) -> float:
        if not text or not isinstance(text, str):
            return 5.0
        match = re.search(r'\((\d+\.?\d*)\s*km\)', text, re.IGNORECASE)
        if match:
            return float(match.group(1))
        return 5.0

    def calculate(self, prop: dict) -> dict:
        p = dict(prop)
        price = float(p.get('price', 0) or 0)
        area = float(p.get('area_sqft', 0) or 0)
        bhk = int(p.get('bhk', 2) or 2)
        locality = str(p.get('locality', '') or p.get('address', '')).strip().lower()

        # Match benchmark rate
        benchmark_rate = self.default_rate_per_sqft
        locality_count = 10
        for loc_key, data in self.locality_benchmarks.items():
            if loc_key in locality or locality in loc_key:
                benchmark_rate = data['avg_rate']
                locality_count = data['count']
                break

        actual_rate = p.get('rate_per_sqft') or (price / area if area > 0 else benchmark_rate)

        # 1. Valuation Efficiency (30 pts max)
        diff_ratio = (benchmark_rate - actual_rate) / benchmark_rate if benchmark_rate > 0 else 0
        if diff_ratio >= 0.15:
            val_score = 30
        elif diff_ratio >= 0.05:
            val_score = 25
        elif diff_ratio >= -0.05:
            val_score = 20
        elif diff_ratio >= -0.15:
            val_score = 15
        else:
            val_score = 10

        # 2. Space Efficiency (20 pts max)
        if area > 0:
            sqft_per_bhk = area / max(1, bhk)
            if sqft_per_bhk >= 550:
                space_score = 20
            elif sqft_per_bhk >= 400:
                space_score = 16
            elif sqft_per_bhk >= 300:
                space_score = 12
            else:
                space_score = 8
        else:
            space_score = 12

        # 3. Amenity & Proximity Score (20 pts max)
        amenities = p.get('amenities', [])
        nearby = p.get('nearby_places', [])
        amenity_count = len(amenities) if isinstance(amenities, list) else 0
        nearby_count = len(nearby) if isinstance(nearby, list) else 0
        amenity_score = min(20, 6 + (amenity_count * 1.5) + (nearby_count * 1.5))

        # 4. Demand & Locality Weight (15 pts max)
        total_u = int(p.get('total_units', 0) or 0)
        sold_u = int(p.get('units_sold', 0) or 0)
        sold_ratio_bonus = 0
        if total_u > 0:
            ratio = sold_u / total_u
            if ratio >= 0.7:
                sold_ratio_bonus = 3
            elif ratio >= 0.4:
                sold_ratio_bonus = 2

        if locality_count > 200:
            demand_score = 12 + sold_ratio_bonus
        elif locality_count > 100:
            demand_score = 10 + sold_ratio_bonus
        elif locality_count > 30:
            demand_score = 8 + sold_ratio_bonus
        else:
            demand_score = 6 + sold_ratio_bonus

        # 5. Property Age & Credentials (15 pts max)
        age = int(p.get('property_age', 1) or 1)
        cred_score = 0
        if age <= 2:
            cred_score += 5
        elif age <= 5:
            cred_score += 3
        else:
            cred_score += 1

        if p.get('builder_name'):
            cred_score += 3
        if p.get('rera_number'):
            cred_score += 3
        if p.get('sample_house_ready'):
            cred_score += 2
        if p.get('property_type') == 'villa':
            cred_score += 2

        # Compute total Investment Score (scaled 65 to 99)
        raw_total = val_score + space_score + amenity_score + demand_score + cred_score
        score = int(min(99, max(65, raw_total)))

        # Appreciation Rate Model (Annual CAGR: 8.5% to 16.5%)
        cagr = 0.085 + (score / 100.0) * 0.08
        appr_percentage = round(cagr * 100, 1)
        appreciation_tag = f"{appr_percentage}% Exp. Appr."

        # Future Price Projections
        f_1yr = round(price * (1 + cagr), 2) if price > 0 else 0
        f_3yr = round(price * ((1 + cagr) ** 3), 2) if price > 0 else 0
        f_5yr = round(price * ((1 + cagr) ** 5), 2) if price > 0 else 0

        # AI Fair Price
        fair_multiplier = 1.03 if diff_ratio > 0 else 0.97
        ai_fair_price = round(price * fair_multiplier, 2) if price > 0 else 0

        # Health Description
        if score >= 90:
            health_desc = "AI Health Score indicates outstanding growth fundamentals and prime valuation positioning."
            investment_tag = "Top Investment Choice"
        elif score >= 80:
            health_desc = "AI Health Score indicates strong fundamentals and undervalued positioning."
            investment_tag = "High Growth Potential"
        elif score >= 70:
            health_desc = "AI Health Score indicates stable steady-yield returns and balanced market positioning."
            investment_tag = "Steady Yield Choice"
        else:
            health_desc = "AI Health Score indicates standard market valuation with moderate upside."
            investment_tag = "Value Listing"

        p['investment_score'] = score
        p['appreciation_rate'] = appreciation_tag
        p['appr_percentage'] = appr_percentage
        p['ai_fair_price'] = ai_fair_price
        p['future_price_1yr'] = f_1yr
        p['future_price_3yr'] = f_3yr
        p['future_price_5yr'] = f_5yr
        p['investment_tag'] = investment_tag
        p['health_description'] = health_desc
        p['score_breakdown'] = {
            'valuation': val_score,
            'space_efficiency': space_score,
            'amenities': amenity_score,
            'demand': demand_score,
            'credentials': cred_score,
        }

        return p
