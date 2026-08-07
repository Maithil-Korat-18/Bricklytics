"""
core/exceptions/base.py — Custom Business Exception Hierarchy
=============================================================
All custom exceptions inherit from BricklyticsBaseException.

Usage:
    raise ResourceNotFoundError('Property not found', resource='property', resource_id=prop_id)
"""

from typing import Any


class BricklyticsBaseException(Exception):
    """
    Root exception for all Bricklytics domain errors.

    Attributes:
        message   — human-readable error text
        code      — application-level error code string (e.g. 'PROPERTY_NOT_FOUND')
        http_status — HTTP status code to return
        extra     — arbitrary extra context for logging / response
    """
    message:     str = 'An unexpected error occurred.'
    code:        str = 'INTERNAL_ERROR'
    http_status: int = 500

    def __init__(
        self,
        message: str | None = None,
        code:    str | None = None,
        **extra: Any,
    ) -> None:
        self.message     = message     or self.__class__.message
        self.code        = code        or self.__class__.code
        self.http_status = extra.pop('http_status', self.__class__.http_status)
        self.extra       = extra
        super().__init__(self.message)

    def to_dict(self) -> dict:
        return {
            'code':    self.code,
            'message': self.message,
            **self.extra,
        }


# ── 4xx Client Errors ────────────────────────────────────────────────────────

class ValidationError(BricklyticsBaseException):
    """Raised when input data fails validation."""
    message     = 'Validation failed.'
    code        = 'VALIDATION_ERROR'
    http_status = 400

    def __init__(self, message: str | None = None, errors: dict | None = None, **extra):
        super().__init__(message, **extra)
        self.errors = errors or {}


class BadRequestError(BricklyticsBaseException):
    """Generic 400 — malformed request."""
    message     = 'Bad request.'
    code        = 'BAD_REQUEST'
    http_status = 400


class AuthenticationError(BricklyticsBaseException):
    """Raised when credentials are missing or invalid."""
    message     = 'Authentication credentials were not provided or are invalid.'
    code        = 'AUTHENTICATION_ERROR'
    http_status = 401


class PermissionDeniedError(BricklyticsBaseException):
    """Raised when the caller lacks permission."""
    message     = 'You do not have permission to perform this action.'
    code        = 'PERMISSION_DENIED'
    http_status = 403


class ResourceNotFoundError(BricklyticsBaseException):
    """Raised when a requested resource does not exist."""
    message     = 'The requested resource was not found.'
    code        = 'NOT_FOUND'
    http_status = 404

    def __init__(
        self,
        message:     str | None = None,
        resource:    str | None = None,
        resource_id: Any        = None,
        **extra,
    ) -> None:
        super().__init__(message, **extra)
        if resource:
            self.extra['resource']    = resource
        if resource_id is not None:
            self.extra['resource_id'] = str(resource_id)


class ConflictError(BricklyticsBaseException):
    """Raised when a resource already exists or state conflicts."""
    message     = 'Resource conflict.'
    code        = 'CONFLICT'
    http_status = 409


class UnprocessableEntityError(BricklyticsBaseException):
    """Raised when business rules prevent processing the request."""
    message     = 'Unable to process the request due to business rule violation.'
    code        = 'UNPROCESSABLE_ENTITY'
    http_status = 422


# ── 5xx Server Errors ────────────────────────────────────────────────────────

class DatabaseError(BricklyticsBaseException):
    """Raised when a database operation fails."""
    message     = 'A database error occurred.'
    code        = 'DATABASE_ERROR'
    http_status = 500


class ServiceUnavailableError(BricklyticsBaseException):
    """Raised when an external service or ML model is unavailable."""
    message     = 'Service temporarily unavailable.'
    code        = 'SERVICE_UNAVAILABLE'
    http_status = 503


class MLModelError(BricklyticsBaseException):
    """Raised when an ML prediction fails."""
    message     = 'ML model prediction failed.'
    code        = 'ML_MODEL_ERROR'
    http_status = 500
