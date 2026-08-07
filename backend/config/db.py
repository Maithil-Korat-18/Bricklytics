"""
config/db.py — MongoDB Connection Manager
==========================================
Centralised MongoEngine connection setup.

Usage:
    from config.db import connect_mongodb
    connect_mongodb()   # called once at startup (wsgi/asgi)

Environment variables (defined in .env):
    MONGODB_URI     — full connection URI
    DATABASE_NAME   — database name
"""

import logging

import mongoengine
from django.conf import settings

logger = logging.getLogger('bricklytics.db')

_connected: bool = False


def connect_mongodb() -> None:
    """
    Establish a MongoEngine connection.
    Safe to call multiple times — subsequent calls are no-ops.
    """
    global _connected

    if _connected:
        logger.debug('MongoDB already connected — skipping.')
        return

    uri  = settings.MONGODB_URI
    name = settings.DATABASE_NAME

    try:
        mongoengine.connect(
            db=name,
            host=uri,
            # Connection pool settings (tune for production)
            maxPoolSize=50,
            minPoolSize=5,
            connectTimeoutMS=5_000,
            serverSelectionTimeoutMS=5_000,
            retryWrites=True,
            uuidRepresentation='standard',
        )
        _connected = True
        logger.info('[OK] MongoDB connected  db=%s', name)

    except Exception as exc:
        logger.critical('[FAIL] MongoDB connection FAILED: %s', exc, exc_info=True)
        raise SystemExit(1) from exc


def disconnect_mongodb() -> None:
    """Gracefully close all MongoEngine connections (useful in tests)."""
    global _connected
    mongoengine.disconnect_all()
    _connected = False
    logger.info('MongoDB disconnected.')
