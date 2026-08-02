"""
Bricklytics — WSGI Entry Point
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bricklytics_backend.settings')

# Establish MongoDB connection before serving any requests
from config.db import connect_mongodb  # noqa: E402
connect_mongodb()

application = get_wsgi_application()
