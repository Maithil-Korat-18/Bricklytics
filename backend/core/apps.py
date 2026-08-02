"""
core/apps.py — Core Application Configuration
"""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name         = 'core'
    verbose_name = 'Core Infrastructure'

    def ready(self) -> None:
        """Connect MongoDB when Django is fully loaded."""
        from config.db import connect_mongodb
        connect_mongodb()
