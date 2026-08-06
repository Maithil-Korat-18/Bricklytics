"""
seller/apps.py — Seller Application Configuration
"""
from django.apps import AppConfig


class SellerConfig(AppConfig):
    name         = 'seller'
    verbose_name = 'Seller Module'

    def ready(self):
        try:
            from seller.services.prediction_service import _load_model
            _load_model()
        except Exception:
            pass

