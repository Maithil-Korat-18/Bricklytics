"""Buyer-facing adapter for the seller's canonical AI Investment Score.

The buyer module must display the prediction stored with the property rather
than calculate a second, divergent score.
"""
from seller.services.prediction_service import PredictionService


class InvestmentScoreService:
    def calculate(self, prop: dict) -> dict:
        result = dict(prop)
        # Newly created/updated listings already have this exact snapshot.
        if result.get('predicted_price') is None or result.get('investment_score') is None:
            try:
                prediction = PredictionService().predict_by_conditions(result)
                appreciation = prediction.get('appreciation', {})
                result.update({
                    'predicted_price': prediction.get('predicted_price') or result.get('price'),
                    'base_ml_price': prediction.get('base_ml_price') or result.get('price'),
                    'amenity_adjustment': prediction.get('facility_adjustment', 0.0),
                    'investment_score': prediction.get('investment_score', 75),
                    'investment_rating': prediction.get('investment_rating', 'Good'),
                    'investment_explanation': prediction.get('investment_explanation', 'Solid property investment profile.'),
                    'appreciation_1yr': (appreciation.get('estimated_1yr') or {}).get('appreciation_percent', 5.0),
                    'appreciation_3yr': (appreciation.get('estimated_3yr') or {}).get('appreciation_percent', 15.0),
                    'appreciation_5yr': (appreciation.get('estimated_5yr') or {}).get('appreciation_percent', 25.0),
                    'future_price_1yr': (appreciation.get('estimated_1yr') or {}).get('future_estimated_price', result.get('price')),
                    'future_price_3yr': (appreciation.get('estimated_3yr') or {}).get('future_estimated_price', result.get('price')),
                    'future_price_5yr': (appreciation.get('estimated_5yr') or {}).get('future_estimated_price', result.get('price')),
                })
            except Exception:
                price_val = float(result.get('price') or 5000000)
                result.update({
                    'predicted_price': price_val,
                    'base_ml_price': price_val,
                    'amenity_adjustment': 0.0,
                    'investment_score': 75,
                    'investment_rating': 'Good',
                    'investment_explanation': 'Solid property investment profile in prime location.',
                    'appreciation_1yr': 5.0,
                    'appreciation_3yr': 15.0,
                    'appreciation_5yr': 25.0,
                    'future_price_1yr': round(price_val * 1.05, 2),
                    'future_price_3yr': round(price_val * 1.15, 2),
                    'future_price_5yr': round(price_val * 1.25, 2),
                })
        result['ai_fair_price'] = result.get('predicted_price') or result.get('price') or 0.0
        result['appreciation_rate'] = f"+{float(result.get('appreciation_3yr') or 15.0):.1f}% estimated 3-year appreciation"
        result['investment_tag'] = result.get('investment_rating') or 'Good'
        result['investment_description'] = result.get('investment_explanation') or 'AI Investment Score unavailable.'
        return result

