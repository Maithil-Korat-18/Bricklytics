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


class ReplyToInquiryView(BaseAPIView):
    """POST /api/seller/inquiries/<inquiry_id>/reply/"""
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def post(self, request, inquiry_id: str):
        reply_text = request.data.get('reply', '').strip()
        if not reply_text:
            return self.error_response("Reply text cannot be empty.", status_code=400)
        
        result = self.service.reply_to_inquiry(inquiry_id=inquiry_id, reply_text=reply_text, seller_id=str(request.user.id))
        return self.success_response(data=result, message='Reply sent successfully to buyer.')

