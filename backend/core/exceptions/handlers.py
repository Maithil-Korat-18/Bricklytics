"""
core/exceptions/handlers.py — Global DRF Exception Handler
============================================================
Registered via REST_FRAMEWORK['EXCEPTION_HANDLER'] in settings.py.

Converts ALL exceptions (DRF native + custom Bricklytics) into the
standard API response envelope:

  { "success": false, "message": "...", "errors": {...} }
"""

import logging
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import exceptions as drf_exceptions

from core.exceptions.base import (
    BricklyticsBaseException,
    ValidationError as BricklyticsValidationError,
)

logger = logging.getLogger('bricklytics.api')


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    """
    Global exception handler for Django REST Framework.

    Processing order:
      1. Custom BricklyticsBaseException subclasses
      2. DRF native exceptions (ValidationError, NotFound, PermissionDenied …)
      3. Unhandled exceptions → 500 Internal Server Error
    """
    # ── 1. Our custom exceptions ─────────────────────────────────────────────
    if isinstance(exc, BricklyticsValidationError):
        logger.warning('Validation error: %s | errors=%s', exc.message, exc.errors)
        return _error_response(
            message=exc.message,
            errors=exc.errors,
            status_code=exc.http_status,
        )

    if isinstance(exc, BricklyticsBaseException):
        logger.warning('Domain error [%s]: %s', exc.code, exc.message)
        return _error_response(
            message=exc.message,
            errors={'code': exc.code, **exc.extra},
            status_code=exc.http_status,
        )

    # ── 2. DRF native exceptions ─────────────────────────────────────────────
    response = drf_exception_handler(exc, context)

    if response is not None:
        logger.warning('DRF exception [%s]: %s', exc.__class__.__name__, exc)

        if isinstance(exc, drf_exceptions.ValidationError):
            return _error_response(
                message='Validation failed.',
                errors=_flatten_drf_errors(response.data),
                status_code=response.status_code,
            )

        message = _extract_drf_message(response.data)
        return _error_response(
            message=message,
            errors={},
            status_code=response.status_code,
        )

    # ── 3. Unhandled exceptions → 500 ────────────────────────────────────────
    logger.exception('Unhandled exception: %s', exc)
    return _error_response(
        message='An internal server error occurred. Please try again later.',
        errors={'type': exc.__class__.__name__},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _error_response(message: str, errors: Any, status_code: int) -> Response:
    """Build the standard error envelope."""
    return Response(
        {
            'success': False,
            'message': message,
            'errors':  errors,
        },
        status=status_code,
    )


def _flatten_drf_errors(data: Any, parent_key: str = '') -> dict:
    """Recursively flatten nested DRF ValidationError detail into a flat dict."""
    items: dict = {}

    if isinstance(data, dict):
        for key, value in data.items():
            full_key = f'{parent_key}.{key}' if parent_key else key
            items.update(_flatten_drf_errors(value, full_key))

    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                items.update(_flatten_drf_errors(item, f'{parent_key}[{i}]'))
            else:
                items[parent_key] = str(item)
    else:
        items[parent_key] = str(data)

    return items


def _extract_drf_message(data: Any) -> str:
    """Pull the first human-readable message from DRF error data."""
    if isinstance(data, dict):
        detail = data.get('detail', '')
        return str(detail) if detail else 'An error occurred.'
    if isinstance(data, list) and data:
        return str(data[0])
    return str(data) if data else 'An error occurred.'
