"""
core/apps.py — Core Application Configuration
"""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name         = 'core'
    verbose_name = 'Core Infrastructure'

    def ready(self) -> None:
        """Connect MongoDB and check database seeding when Django is loaded."""
        from config.db import connect_mongodb
        connect_mongodb()
        try:
            from core.services.auto_seed_service import start_auto_seed_in_background
            start_auto_seed_in_background()
        except Exception:
            pass
