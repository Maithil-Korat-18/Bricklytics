"""
seller/views/prediction_views.py — ML Prediction API Endpoints
"""

from core.base.view import BaseAPIView
from seller.services.prediction_service import PredictionService


class PredictPriceView(BaseAPIView):
    """POST /api/predict-price/ or POST /api/seller/properties/<pk>/predict-price/"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PredictionService()

    def post(self, request, pk=None):
        if pk:
            result = self.service.predict_price(pk)
        else:
            conditions = request.data or {}
            result = self.service.predict_by_conditions(conditions)

        return self.success_response(
            data=result,
            message='Price prediction completed successfully.',
        )


class PredictConditionView(BaseAPIView):
    """POST /api/seller/properties/predict-condition/"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PredictionService()

    def post(self, request):
        conditions = request.data or {}
        result = self.service.predict_by_conditions(conditions)
        return self.success_response(
            data=result,
            message='Condition-wise ML prediction completed successfully.',
        )


class AhmedabadLocationsView(BaseAPIView):
    """GET /api/seller/properties/locations/"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PredictionService()

    def get(self, request):
        result = self.service.get_ahmedabad_locations()
        return self.success_response(
            data=result,
            message='Ahmedabad locations fetched successfully.',
        )


class PredictAppreciationView(BaseAPIView):
    """POST /api/seller/properties/<pk>/predict-appreciation/"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PredictionService()

    def post(self, request, pk):
        result = self.service.predict_appreciation(pk)
        return self.success_response(
            data=result,
            message='Appreciation prediction completed successfully.',
        )


class PredictionHistoryView(BaseAPIView):
    """GET /api/seller/properties/<pk>/predictions/"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PredictionService()

    def get(self, request, pk):
        history = self.service.get_prediction_history(pk)
        return self.success_response(
            data=history,
            message='Prediction history fetched.',
        )
