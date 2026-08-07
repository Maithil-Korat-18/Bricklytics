"""
seller/urls/main_urls.py — Seller Module URL Router
====================================================
All seller endpoints are prefixed: /api/seller/

Future sub-routers (uncomment when you build each feature):
    path('properties/', include('seller.urls.property_urls')),
    path('profile/',    include('seller.urls.profile_urls')),
    path('analytics/', include('seller.urls.analytics_urls')),
"""

from django.urls import path, include

from seller.views.analytics_views import AnalyticsDashboardView, SellerDashboardView, ReplyToInquiryView
from seller.views.seller_request_views import (
    SellerRequestsListView,
    SellerRequestActionView,
    SellerRequestReplyView,
    SellerProfileView,
)

app_name = 'seller'

urlpatterns = [
    path('properties/', include('seller.urls.property_urls')),
    path('analytics/', AnalyticsDashboardView.as_view(), name='seller-analytics'),
    path('dashboard/', SellerDashboardView.as_view(), name='seller-dashboard'),
    path('requests/', SellerRequestsListView.as_view(), name='seller-requests-list'),
    path('requests/<str:pk>/action/', SellerRequestActionView.as_view(), name='seller-request-action'),
    path('requests/<str:pk>/reply/', SellerRequestReplyView.as_view(), name='seller-request-reply'),
    path('inquiries/<str:inquiry_id>/reply/', ReplyToInquiryView.as_view(), name='seller-inquiry-reply'),
    path('profile/', SellerProfileView.as_view(), name='seller-profile'),
]

