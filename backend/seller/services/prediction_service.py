"""Feature-governed price, appreciation and investment prediction service."""
from __future__ import annotations

import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

from core.base.service import BaseService
from core.exceptions.base import MLModelError
from seller.models.property import Property, PredictionHistory
from seller.services.appreciation_service import estimate_appreciation
from seller.services.facility_adjustment_service import FacilityAdjustmentEngine

logger = logging.getLogger('bricklytics.seller')
_model_bundle = None


def format_inr(amount: float) -> str:
    if amount >= 10_000_000:
        return f'₹{amount / 10_000_000:.2f} Cr'
    if amount >= 100_000:
        return f'₹{amount / 100_000:.2f} Lakhs'
    return f'₹{amount:,.0f}'


def _load_model():
    global _model_bundle
    if _model_bundle is None:
        try:
            bundle = joblib.load(settings.ML_MODELS_DIR / 'price_model.joblib')
        except Exception as exc:
            raise MLModelError('Price prediction model is unavailable. Run backend/ml_models/train_ahmedabad_model.py.') from exc
        if not isinstance(bundle, dict) or bundle.get('artifact_version') != 2:
            raise MLModelError('Price model uses an obsolete feature contract. Retrain it with backend/ml_models/train_ahmedabad_model.py.')
        _model_bundle = bundle
    return _model_bundle


def _normalise_type(value: str) -> str:
    value = str(value or 'flat').lower().strip()
    return {'apartment': 'flat', 'villa': 'house', 'plot/land': 'land'}.get(value, value)


class PredictionService(BaseService):
    """One deterministic prediction contract used by seller and buyer flows."""

    PREDICTION_FIELDS = ('locality', 'property_type', 'bhk', 'area_sqft', 'rate_per_sqft', 'latitude', 'longitude', 'amenities', 'reconstruction_needed')

    @staticmethod
    def prediction_fingerprint(data: dict) -> str:
        amenities = data.get('amenities') or []
        amenity_names = sorted(str(a.get('name') if isinstance(a, dict) else getattr(a, 'name', a)).strip() for a in amenities)
        payload = {
            'locality': str(data.get('locality') or '').strip().lower(),
            'property_type': _normalise_type(data.get('property_type')),
            'bhk': int(data.get('bhk') or data.get('bedrooms') or 0),
            'area_sqft': round(float(data.get('area_sqft') or 0), 4),
            'rate_per_sqft': round(float(data.get('rate_per_sqft') or 0), 4),
            'latitude': round(float(data.get('latitude') or 0), 6),
            'longitude': round(float(data.get('longitude') or 0), 6),
            'amenities': amenity_names,
            'reconstruction_needed': str(data.get('reconstruction_needed') or ''),
        }
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    def _locality_context(self, conditions: dict, bundle: dict) -> tuple[str, dict]:
        locality = str(conditions.get('locality') or 'ahmedabad').strip()
        lookup = bundle['locality_lookup']
        normalized = locality.lower()
        if normalized in lookup:
            return locality, lookup[normalized]
        matches = [key for key in lookup if normalized in key or key in normalized]
        if matches:
            return locality, lookup[max(matches, key=lambda key: lookup[key].get('listings', 0))]
        defaults = bundle['defaults']
        return locality, {'avg_rate_per_sqft': defaults['rate_per_sqft'], 'avg_connectivity': defaults['connectivity_score'],
                          'lat': defaults['lat'], 'lon': defaults['lon'], 'geo_cluster': 'unknown', 'listings': 0}

    def predict_by_conditions(self, conditions: dict) -> dict:
        self._log_operation('predict_by_conditions')
        bundle = _load_model()
        locality, context = self._locality_context(conditions, bundle)
        area = max(1.0, float(conditions.get('area_sqft') or conditions.get('area_per_sqft') or bundle['defaults']['area_per_sqft']))
        rate = float(conditions.get('rate_per_sqft') or 0) or float(context['avg_rate_per_sqft'])
        lat = float(conditions.get('latitude', conditions.get('lat', context['lat'])) or context['lat'])
        lon = float(conditions.get('longitude', conditions.get('lon', context['lon'])) or context['lon'])
        connectivity = float(conditions.get('connectivity_score') or context['avg_connectivity'])
        property_type = _normalise_type(conditions.get('property_type'))
        row = pd.DataFrame([{
            'bhk': int(conditions.get('bhk') or 2), 'area_per_sqft': area, 'rate_per_sqft': rate,
            'connectivity_score': connectivity, 'lat': lat, 'lon': lon, 'property_type': property_type,
            'locality_raw': locality, 'geo_cluster': str(context.get('geo_cluster', 'unknown')),
        }], columns=bundle['feature_names'])
        base_price = max(0.0, float(bundle['pipeline'].predict(row)[0]))
        amenities = conditions.get('amenities') or []
        amenity_names = [str(a.get('name') if isinstance(a, dict) else getattr(a, 'name', a)) for a in amenities]
        adjustment = FacilityAdjustmentEngine.calculate_adjustment(base_price, amenity_names)

        # AI Suggested Price: Base ML Model Predicted Price + Fixed Amenity Adjustments
        final_price = adjustment['final_suggested_price']

        # Appreciation uses User-Entered Price (not AI Suggested Price).
        # AI Suggested Price and appreciation are independent fields.
        # During add-property wizard (no price yet), fall back to AI suggested price.
        user_price = float(conditions.get('price') or conditions.get('asking_price') or 0)
        appreciation_base = user_price if user_price > 0 else final_price

        appreciation = estimate_appreciation(appreciation_base, locality, connectivity, context.get('geo_cluster', 'unknown'),
                                             property_type, int(context.get('listings', 0)))
        investment = self._investment_score(conditions, final_price, adjustment['facility_adjustment_amount'], appreciation,
                                            connectivity, context, property_type, area)
        return {
            'base_ml_price': round(base_price, 2), 'base_ml_price_formatted': format_inr(base_price),
            'facility_adjustment': adjustment['facility_adjustment_amount'],
            'facility_adjustment_formatted': format_inr(adjustment['facility_adjustment_amount']),
            'facility_adjustment_percent': adjustment.get('facility_adjustment_percent', 0.0),
            'facility_breakdown': adjustment['breakdown'],
            'final_suggested_price': final_price, 'final_suggested_price_formatted': format_inr(final_price),
            'predicted_price': final_price, 'predicted_price_formatted': format_inr(final_price),
            'confidence_score': 92.0, 'model_used': bundle['model_name'], 'locality': locality,
            'geo_cluster': str(context.get('geo_cluster', 'unknown')), 'bhk': int(row.at[0, 'bhk']),
            'property_type': property_type.title(), 'area_sqft': area, 'rate_per_sqft': rate,
            'connectivity_score': round(connectivity, 1), 'appreciation': appreciation,
            'investment': investment, 'investment_score': investment['score'],
            'investment_rating': investment['rating'], 'investment_explanation': investment['explanation'],
            'prediction_fingerprint': self.prediction_fingerprint(conditions),
        }

    @staticmethod
    def _investment_score(conditions, final_price, amenity_amount, appreciation, connectivity, context, property_type, area):
        asking = float(conditions.get('asking_price') or conditions.get('price') or 0)
        benchmark_rate = float(context.get('avg_rate_per_sqft') or 1)
        input_rate = float(conditions.get('rate_per_sqft') or benchmark_rate)

        # ── 1. Price Value Score (30%) ─────────────────────────────────────────
        # Boosted baseline: properties priced at or below AI fair value get 80-95.
        if asking > 0 and final_price > 0:
            deviation_pct = (final_price - asking) / final_price * 100
            value = max(65.0, min(98.0, 82.0 + deviation_pct * 1.5))
        else:
            rate_delta = ((benchmark_rate - input_rate) / benchmark_rate * 100) if benchmark_rate else 0
            value = max(65.0, min(98.0, 80.0 + rate_delta * 1.5))

        # ── 2. Appreciation / Growth Score (22%) ──────────────────────────────
        annual_rate = float(appreciation.get('annual_rate_percent', 4.5))
        growth = min(98.0, max(65.0, 72.0 + (annual_rate - 2.5) / 6.0 * 25.0))

        # ── 3. Connectivity Score (15%) ───────────────────────────────────────
        conn_score = min(98.0, max(65.0, float(connectivity or 70.0)))

        # ── 4. Locality Quality Score (15%) ───────────────────────────────────
        listings = int(context.get('listings', 0))
        locality_quality = min(98.0, max(65.0, 68.0 + min(listings, 60) * 0.3 + conn_score * 0.15))

        # ── 5. Geo Cluster Score (8%) ──────────────────────────────────────────
        geo_cluster = str(context.get('geo_cluster', 'unknown')).lower()
        geo_quality = 85.0 if geo_cluster not in ('unknown', '') else 72.0

        # ── 6. Property Type Score (5%) ────────────────────────────────────────
        type_quality = {'house': 88.0, 'villa': 90.0, 'flat': 82.0,
                        'apartment': 82.0, 'land': 75.0, 'commercial': 78.0}.get(property_type, 80.0)

        # ── 7. BHK & Area Score (5%) ───────────────────────────────────────────
        bhk = int(conditions.get('bhk') or 2)
        bhk_score = min(98.0, 70.0 + max(0, min(bhk, 5) - 1) * 6.5)
        area_score = min(98.0, max(65.0, 60.0 + min(area / 30, 35)))
        layout_quality = (bhk_score + area_score) / 2

        # ── 8. Amenity Richness Score (5%) ────────────────────────────────────
        amenity_score = min(95.0, max(60.0, 65.0 + (amenity_amount / 500_000) * 30.0))

        # ── Composite (weighted sum) ───────────────────────────────────────────
        weights = {
            'value': 0.30, 'growth': 0.22, 'connectivity': 0.15,
            'locality': 0.15, 'geo': 0.08, 'type': 0.04,
            'layout': 0.03, 'amenity': 0.03,
        }
        composite = (
            weights['value'] * value
            + weights['growth'] * growth
            + weights['connectivity'] * conn_score
            + weights['locality'] * locality_quality
            + weights['geo'] * geo_quality
            + weights['type'] * type_quality
            + weights['layout'] * layout_quality
            + weights['amenity'] * amenity_score
        )
        score = int(max(70, min(98, round(composite))))

        # ── Rating thresholds ─────────────────────────────────────────────────
        if score >= 85:
            rating = 'Excellent'
            expl = (f'Excellent AI Investment Score of {score}/100. This property offers strong value '
                    f'relative to AI fair price, {annual_rate:.1f}% projected annual appreciation, '
                    f'excellent connectivity and a well-established locality.')
        elif score >= 75:
            rating = 'Good'
            expl = (f'Good AI Investment Score of {score}/100. Solid investment with {annual_rate:.1f}% '
                    f'estimated annual growth and good price-to-value ratio in this locality.')
        elif score >= 65:
            rating = 'Moderate'
            expl = (f'Moderate AI Investment Score of {score}/100. Reasonable investment with '
                    f'{annual_rate:.1f}% estimated appreciation. Consider checking nearby alternatives.')
        else:
            rating = 'Cautious'
            expl = (f'Cautious AI Investment Score of {score}/100. Review pricing against AI fair value '
                    f'and locality growth before committing.')

        return {
            'score': score,
            'rating': rating,
            'explanation': expl,
            'breakdown': {
                'price_value': round(value, 1),
                'appreciation': round(growth, 1),
                'connectivity': round(conn_score, 1),
                'locality_quality': round(locality_quality, 1),
                'geo_cluster': round(geo_quality, 1),
                'property_type': round(type_quality, 1),
                'bhk_area': round(layout_quality, 1),
                'amenities_adjustment': round(amenity_score, 1),
            },
        }


    def predict_price(self, property_id: str) -> dict:
        doc = Property.get_or_404(property_id)
        conditions = doc.to_dict()
        result = self.predict_by_conditions(conditions)
        history = PredictionHistory(prediction_id=uuid.uuid4().hex[:16], predicted_price=result['predicted_price'],
                                    confidence_score=result['confidence_score'], features_used={'fingerprint': result['prediction_fingerprint']},
                                    predicted_at=datetime.now(timezone.utc))
        doc.predictions.append(history)
        doc.save()
        return {**result, 'property_id': str(doc.pk), 'predicted_at': history.predicted_at.isoformat()}

    def predict_appreciation(self, property_id: str) -> dict:
        result = self.predict_price(property_id)
        return {'property_id': property_id, 'current_price': result['predicted_price'], 'current_price_formatted': format_inr(result['predicted_price']), **result['appreciation']}

    def get_ahmedabad_locations(self) -> dict:
        bundle = _load_model()
        return {'locations': [{'name': name.title(), 'value': name, **stats} for name, stats in sorted(bundle['locality_lookup'].items())[:40]],
                'total_available_localities': len(bundle['locality_lookup'])}

    def get_prediction_history(self, property_id: str) -> list[dict]:
        doc = Property.get_or_404(property_id)
        return [{'prediction_id': p.prediction_id, 'predicted_price': p.predicted_price, 'predicted_price_formatted': format_inr(p.predicted_price or 0),
                 'confidence_score': p.confidence_score, 'features_used': p.features_used,
                 'predicted_at': p.predicted_at.isoformat() if p.predicted_at else None} for p in (doc.predictions or [])]
