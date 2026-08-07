"""Feature-governed price, appreciation, and investment prediction service."""
from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

from core.base.service import BaseService
from core.exceptions.base import MLModelError
from common.utils import normalize_property_type
from seller.models.property import Property, PredictionHistory
from seller.services.appreciation_service import estimate_appreciation

logger = logging.getLogger('bricklytics.seller')
_model_bundle = None
_resale_rules = None


def format_inr(amount: float) -> str:
    if amount >= 10_000_000:
        return f'₹{amount / 10_000_000:.2f} Cr'
    if amount >= 100_000:
        return f'₹{amount / 100_000:.2f} Lakhs'
    return f'₹{amount:,.0f}'


def _load_resale_rules() -> dict:
    global _resale_rules
    if _resale_rules is None:
        rules_path = Path(settings.BASE_DIR) / 'config' / 'resale_rules.json'
        if rules_path.exists():
            try:
                with open(rules_path, 'r', encoding='utf-8') as f:
                    _resale_rules = json.load(f)
            except Exception as exc:
                logger.error('Failed to load resale_rules.json: %s', exc)

        if not _resale_rules:
            _resale_rules = {
                'property_age': {'0_to_2': 0.0, '3_to_5': -3.0, '6_to_10': -7.0, '11_to_15': -12.0, 'above_15': -18.0},
                'renovation_status': {'newly renovated': 6.0, 'major renovation': 3.0, 'minor renovation': 0.0, 'never renovated': -3.0, 'requires reconstruction': -8.0},
                'facing_direction': {'east': 2.0, 'north': 2.0, 'north-east': 2.0, 'west': 0.0, 'south': -2.0}
            }
    return _resale_rules


def _load_model():
    global _model_bundle
    if _model_bundle is None:
        model_path = settings.ML_MODELS_DIR / 'price_model.joblib'
        prep_path = settings.ML_MODELS_DIR / 'preprocessor.joblib'
        if not model_path.exists():
            alt_path = settings.BASE_DIR.parent / 'bricklytics_model' / 'models' / 'price_model.joblib'
            if alt_path.exists():
                model_path = alt_path
                prep_path = settings.BASE_DIR.parent / 'bricklytics_model' / 'models' / 'preprocessor.joblib'
        try:
            bundle = joblib.load(model_path)
            preprocessor = joblib.load(prep_path) if prep_path.exists() else None
            _model_bundle = {
                'bundle': bundle,
                'preprocessor': preprocessor,
                'pipeline': bundle.get('pipeline') if isinstance(bundle, dict) and 'pipeline' in bundle else None,
                'model': bundle.get('model') if isinstance(bundle, dict) else bundle,
                'model_name': bundle.get('model_name', 'Trained Estimator') if isinstance(bundle, dict) else 'Trained Estimator',
                'is_log_target': bundle.get('is_log_target', True) if isinstance(bundle, dict) else True,
            }
        except Exception as exc:
            raise MLModelError('Price prediction model is unavailable. Run train_model.py.') from exc
    return _model_bundle


class PredictionService(BaseService):
    """Deterministic price, appreciation, and investment score prediction contract."""

    PREDICTION_FIELDS = ('area_sqft', 'carpetArea', 'bhk', 'property_type', 'latitude', 'longitude', 'listingType', 'reconstructionNeeded', 'propertyAge', 'facing')

    @staticmethod
    def prediction_fingerprint(data: dict) -> str:
        payload = {
            'property_type': normalize_property_type(data.get('property_type') or data.get('propertyType')),
            'bhk': int(data.get('bhk') or data.get('bedrooms') or 2),
            'area_sqft': round(float(data.get('carpetArea') or data.get('area_sqft') or data.get('area_per_sqft') or 1000.0), 2),
            'latitude': round(float(data.get('latitude') or data.get('lat') or 23.0225), 6),
            'longitude': round(float(data.get('longitude') or data.get('lon') or 72.5714), 6),
            'listing_type': str(data.get('listingType') or data.get('listing_type') or data.get('saleType') or '').lower().strip(),
            'reconstruction_needed': str(data.get('reconstructionNeeded') or data.get('reconstruction_needed') or '').lower().strip(),
        }
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    @staticmethod
    def _investment_score(conditions: dict, base_price: float, final_price: float, property_type: str, area: float, annual_rate: float = 7.5) -> dict:
        asking = float(conditions.get('price') or conditions.get('expectedPrice') or 0)
        ai_price = float(final_price or base_price or asking or 1.0)
        
        # 1. Price Fairness Factor (25% weight)
        # Compare Market Asking Price vs AI Suggested Market Price
        if asking > 0 and ai_price > 0:
            diff_pct = ((asking - ai_price) / ai_price) * 100.0
            if diff_pct <= 0:
                # Underpriced or fair price -> score 86 to 95
                fairness_score = min(95.0, 86.0 + min(9.0, abs(diff_pct) * 1.2))
            else:
                # Overpriced -> score penalized
                fairness_score = max(40.0, 82.0 - (diff_pct * 1.8))
        else:
            diff_pct = 0.0
            fairness_score = 80.0

        # 2. Future Appreciation / Locality Growth Factor (25% weight)
        # Bounded between 50 and 94 based on locality annual appreciation rate
        appreciation_score = min(94.0, max(50.0, 55.0 + (annual_rate - 5.0) * 8.5))

        # 3. Location Quality Factor (25% weight)
        # Reuses connectivity & locality signals
        raw_conn = conditions.get('connectivity_score') or conditions.get('location_score')
        if raw_conn is not None:
            location_score = min(94.0, max(50.0, float(raw_conn)))
        else:
            # Estimate location score from locality prominence
            locality = str(conditions.get('locality') or '').lower()
            if any(prime in locality for prime in ['sg highway', 'science city', 'bopal', 'shela', 'bodakdev', 'thaltej', 'satellite', 'ambli', 'prahlad nagar']):
                location_score = 88.0
            elif any(mid in locality for mid in ['gota', 'vastral', 'paldi', 'naranpura', 'chandkheda', 'maninagar', 'navrangpura']):
                location_score = 80.0
            else:
                location_score = 72.0

        # 4. Property Profile & Market Demand Factor (25% weight)
        p_type_norm = str(property_type or '').lower()
        if 'villa' in p_type_norm or 'house' in p_type_norm:
            type_score = 88.0
        elif 'plot' in p_type_norm:
            type_score = 82.0
        else:
            type_score = 84.0

        bhk = int(conditions.get('bhk') or conditions.get('bedrooms') or 2)
        bhk_score = 88.0 if bhk in (2, 3) else (82.0 if bhk >= 4 else 78.0)
        age = int(conditions.get('propertyAge') or conditions.get('property_age') or 1)
        age_score = 90.0 if age <= 2 else (84.0 if age <= 5 else (78.0 if age <= 10 else 70.0))

        profile_score = (0.4 * type_score) + (0.4 * bhk_score) + (0.2 * age_score)

        # Composite Weighted Score (Max 95)
        composite = (
            0.25 * fairness_score
            + 0.25 * appreciation_score
            + 0.25 * location_score
            + 0.25 * profile_score
        )
        
        # Ceil max score strictly at 95 (no 99 or 100 scores)
        score = int(round(max(40, min(95, composite))))

        # Rating Tiers according to user specifications
        if score >= 90:
            rating = 'Excellent'
        elif score >= 80:
            rating = 'Very Good'
        elif score >= 70:
            rating = 'Good'
        elif score >= 60:
            rating = 'Average'
        else:
            rating = 'Poor'

        # Generate concise, human-readable bullet point reasons
        reasons = []

        if location_score >= 82:
            reasons.append("✓ Excellent location quality & high connectivity")
        else:
            reasons.append("✓ Moderate location quality & accessibility")

        if annual_rate >= 8.0:
            reasons.append(f"✓ Strong annual appreciation potential ({annual_rate:.1f}%/yr)")
        elif annual_rate >= 7.0:
            reasons.append(f"✓ Steady locality growth trend ({annual_rate:.1f}%/yr)")
        else:
            reasons.append(f"✓ Moderate locality appreciation ({annual_rate:.1f}%/yr)")

        if diff_pct <= -3.0:
            reasons.append(f"✓ Underpriced asking value ({abs(diff_pct):.1f}% below AI estimate)")
        elif diff_pct <= 3.0:
            reasons.append("✓ Fair asking price aligned with AI market valuation")
        else:
            reasons.append(f"⚠ Asking price is {diff_pct:.1f}% above AI market estimate")

        if annual_rate >= 7.5:
            reasons.append("✓ High demand residential locality")
        else:
            reasons.append("✓ Stable housing demand market")

        if bhk in (2, 3):
            reasons.append("✓ Popular BHK layout with high market liquidity")

        explanation = f"Investment Score of {score}/95 ({rating}). Combines price fairness against AI valuation, {annual_rate:.1f}% annual locality appreciation, location quality, and property profile."

        return {
            'score': score,
            'max_score': 95,
            'rating': rating,
            'explanation': explanation,
            'reasons': reasons,
            'breakdown': {
                'price_fairness': round(fairness_score, 1),
                'locality_appreciation': round(appreciation_score, 1),
                'location_quality': round(location_score, 1),
                'property_profile': round(profile_score, 1),
            }
        }

    def predict_by_conditions(self, conditions: dict) -> dict:
        self._log_operation('predict_by_conditions')
        model_data = _load_model()
        pipeline = model_data['pipeline']
        model = model_data['model']
        preprocessor = model_data['preprocessor']

        # 1. Extract 5 strict ML input features
        area = max(10.0, float(conditions.get('carpetArea') or conditions.get('area_sqft') or conditions.get('area_per_sqft') or 1000.0))
        bhk = int(conditions.get('bhk') or conditions.get('bedrooms') or 2)
        lat = float(conditions.get('latitude') or conditions.get('lat') or 23.0225)
        lon = float(conditions.get('longitude') or conditions.get('lon') or 72.5714)
        prop_type = normalize_property_type(conditions.get('propertyType') or conditions.get('property_type'))

        # Prepare DataFrame matching training feature names: ['area_sqft', 'bhk', 'lat', 'lon', 'property_type']
        row = pd.DataFrame([{
            'area_sqft': area,
            'bhk': bhk,
            'lat': lat,
            'lon': lon,
            'property_type': prop_type,
        }], columns=['area_sqft', 'bhk', 'lat', 'lon', 'property_type'])

        # 2. Predict Base Market Price via ML Model
        is_log_target = model_data.get('is_log_target', True)
        if pipeline is not None and hasattr(pipeline, 'predict'):
            raw_pred = float(pipeline.predict(row)[0])
        elif preprocessor is not None and model is not None:
            X_trans = preprocessor.transform(row)
            raw_pred = float(model.predict(X_trans)[0])
        elif hasattr(model, 'predict'):
            raw_pred = float(model.predict(row)[0])
        else:
            raw_pred = 15.8

        if is_log_target and raw_pred < 30.0:
            base_price = float(np.expm1(raw_pred))
        else:
            base_price = raw_pred

        base_price = round(max(100000.0, base_price), 2)

        # 3. Determine Listing / Sale Type
        listing_type_raw = str(conditions.get('listingType') or conditions.get('listing_type') or conditions.get('saleType') or conditions.get('sale_type') or '').lower()
        is_resale = 'resale' in listing_type_raw

        resale_rules = _load_resale_rules()

        if not is_resale:
            # NEW PROPERTY FLOW: Final Price = Base Market Price
            age_pct = 0.0
            reno_pct = 0.0
            facing_pct = 0.0
            total_adj_pct = 0.0
            age_adj = 0.0
            reno_adj = 0.0
            facing_adj = 0.0
            total_adj = 0.0
            final_price = base_price
            display_listing_type = 'New Property'
            adjustment_breakdown = None
        else:
            # RESALE PROPERTY FLOW: Apply Resale Adjustment Engine rules from resale_rules.json
            display_listing_type = 'Resale Property'
            property_age = int(conditions.get('propertyAge') or conditions.get('property_age') or 1)
            facing = str(conditions.get('facing') or 'East').strip().lower()
            reconstruction_needed = str(conditions.get('reconstructionNeeded') or conditions.get('reconstruction_needed') or '').strip().lower()

            # Age adjustment
            age_rules = resale_rules.get('property_age', {})
            if property_age <= 2:
                age_pct = float(age_rules.get('0_to_2', 0.0))
            elif property_age <= 5:
                age_pct = float(age_rules.get('3_to_5', -3.0))
            elif property_age <= 10:
                age_pct = float(age_rules.get('6_to_10', -7.0))
            elif property_age <= 15:
                age_pct = float(age_rules.get('11_to_15', -12.0))
            else:
                age_pct = float(age_rules.get('above_15', -18.0))

            # Renovation status adjustment
            reno_rules = resale_rules.get('renovation_status', {})
            reno_pct = float(reno_rules.get(reconstruction_needed, 0.0))

            # Facing direction adjustment
            facing_rules = resale_rules.get('facing_direction', {})
            facing_pct = float(facing_rules.get(facing, 0.0))

            total_adj_pct = round(age_pct + reno_pct + facing_pct, 2)
            age_adj = round(base_price * (age_pct / 100.0), 2)
            reno_adj = round(base_price * (reno_pct / 100.0), 2)
            facing_adj = round(base_price * (facing_pct / 100.0), 2)
            total_adj = round(base_price * (total_adj_pct / 100.0), 2)
            final_price = round(max(50000.0, base_price + total_adj), 2)

            adjustment_breakdown = {
                'property_age_adjustment': age_adj,
                'property_age_percent': age_pct,
                'renovation_adjustment': reno_adj,
                'renovation_percent': reno_pct,
                'facing_adjustment': facing_adj,
                'facing_percent': facing_pct,
                'total_adjustment': total_adj,
                'total_adjustment_percent': total_adj_pct,
            }

        # 4. Calculate Appreciation Prediction using Market Asking Price
        locality_str = str(conditions.get('locality') or conditions.get('address') or 'Ahmedabad')
        asking_price = float(conditions.get('price') or conditions.get('expectedPrice') or base_price)
        appreciation = estimate_appreciation(
            current_price=asking_price,
            locality=locality_str,
            connectivity_score=75.0,
            geo_cluster='ahmedabad_central',
            property_type=prop_type,
            locality_listings=15
        )

        # 5. Calculate Investment Score combining AI Suggested Price, Asking Price, Locality Appreciation, Location Quality & Property Profile
        annual_rate = appreciation.get('annual_rate_percent', 7.5)
        investment = self._investment_score(
            conditions=conditions,
            base_price=base_price,
            final_price=final_price,
            property_type=prop_type,
            area=area,
            annual_rate=annual_rate
        )

        return {
            'base_market_price': base_price,
            'base_market_price_formatted': format_inr(base_price),
            'base_ai_price': base_price,
            'base_ai_price_formatted': format_inr(base_price),
            'base_ml_price': base_price,
            'base_ml_price_formatted': format_inr(base_price),
            'listing_type': display_listing_type,
            'adjustment_breakdown': adjustment_breakdown,
            'final_suggested_price': final_price,
            'final_suggested_price_formatted': format_inr(final_price),
            'predicted_price': final_price,
            'predicted_price_formatted': format_inr(final_price),
            'appreciation': appreciation,
            'investment': investment,
            'investment_score': investment['score'],
            'investment_rating': investment['rating'],
            'investment_explanation': investment['explanation'],
            'investment_reasons': investment.get('reasons', []),
            'property_type': prop_type,
            'area_sqft': area,
            'bhk': bhk,
            'latitude': lat,
            'longitude': lon,
            'prediction_fingerprint': self.prediction_fingerprint(conditions),
        }

    def predict_price(self, property_id: str) -> dict:
        doc = Property.get_or_404(property_id)
        conditions = doc.to_dict()
        result = self.predict_by_conditions(conditions)
        history = PredictionHistory(prediction_id=hashlib.md5(f"{doc.pk}-{datetime.now().timestamp()}".encode()).hexdigest()[:16],
                                    predicted_price=result['final_suggested_price'],
                                    features_used={'fingerprint': result['prediction_fingerprint']},
                                    predicted_at=datetime.now(timezone.utc))
        doc.predictions.append(history)
        doc.save()
        return {**result, 'property_id': str(doc.pk), 'predicted_at': history.predicted_at.isoformat()}
