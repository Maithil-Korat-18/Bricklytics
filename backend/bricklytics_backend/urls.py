"""
Bricklytics — Root URL Configuration
All app-level routes are prefixed with /api/
"""

from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from common.views.health import HealthCheckView
from seller.views.prediction_views import PredictPriceView

urlpatterns = [
    # ── Health Check ─────────────────────────────────────────────────────────
    path('api/health/', HealthCheckView.as_view(), name='health-check'),

    # ── AI Price Prediction Endpoint ─────────────────────────────────────────
    path('api/predict-price/', PredictPriceView.as_view(), name='api-predict-price'),

    # ── Authentication Module ────────────────────────────────────────────────
    path('api/auth/', include('accounts.urls.auth_urls')),

    # ── Seller Module ─────────────────────────────────────────────────────────
    path('api/seller/', include('seller.urls.main_urls')),

    # ── Buyer Module ──────────────────────────────────────────────────────────
    path('api/buyer/', include('buyer.urls.main_urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
