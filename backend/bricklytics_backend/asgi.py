"""
Bricklytics — ASGI Entry Point (future async support)
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bricklytics_backend.settings')

from config.db import connect_mongodb  # noqa: E402
connect_mongodb()

application = get_asgi_application()
