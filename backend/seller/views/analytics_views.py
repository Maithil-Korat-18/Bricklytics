"""
seller/views/analytics_views.py — Analytics Dashboard API
"""

from core.base.view import BaseAPIView
from seller.services.property_service import PropertyService
from accounts.permissions import IsSeller


class AnalyticsDashboardView(BaseAPIView):
    """GET /api/seller/analytics/"""
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def get(self, request):
        data = self.service.get_analytics(seller_id=str(request.user.id))
        return self.success_response(
            data=data,
            message='Analytics data fetched successfully.',
        )


class SellerDashboardView(BaseAPIView):
    """GET /api/seller/dashboard/"""
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def get(self, request):
        data = self.service.get_dashboard_data(seller_id=str(request.user.id))
        return self.success_response(data=data, message='Dashboard data fetched successfully.')
