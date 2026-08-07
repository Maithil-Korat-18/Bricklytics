"""
common/responses.py — Standard API Response Builders
=====================================================
Every API endpoint MUST use these helpers to ensure consistent
response envelopes across the entire Bricklytics platform.

SUCCESS envelope:
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }

ERROR envelope:
    {
        "success": false,
        "message": "...",
        "errors": { ... }
    }

PAGINATED envelope:
    {
        "success": true,
        "message": "...",
        "data": {
            "results":   [...],
            "count":     100,
            "page":      1,
            "page_size": 20,
            "total_pages": 5,
            "has_next":  true,
            "has_prev":  false
        }
    }
"""

from typing import Any

from rest_framework import status
from rest_framework.response import Response


# ── Success Responses ─────────────────────────────────────────────────────────

def success_response(
    data:        Any  = None,
    message:     str  = 'Success.',
    status_code: int  = status.HTTP_200_OK,
) -> Response:
    """Generic 2xx success response."""
    return Response(
        {
            'success': True,
            'message': message,
            'data':    data if data is not None else {},
        },
        status=status_code,
    )


def created_response(
    data:    Any = None,
    message: str = 'Resource created successfully.',
) -> Response:
    """201 Created response."""
    return success_response(data, message, status.HTTP_201_CREATED)


def updated_response(
    data:    Any = None,
    message: str = 'Resource updated successfully.',
) -> Response:
    """200 OK update response."""
    return success_response(data, message, status.HTTP_200_OK)


def deleted_response(message: str = 'Resource deleted successfully.') -> Response:
    """200 OK for soft-delete (returns message, no body data)."""
    return success_response({}, message, status.HTTP_200_OK)


def paginated_response(
    results:     list,
    count:       int,
    page:        int,
    page_size:   int,
    message:     str = 'Data fetched successfully.',
) -> Response:
    """Paginated list response."""
    import math
    total_pages = math.ceil(count / page_size) if page_size else 1
    return Response(
        {
            'success': True,
            'message': message,
            'data': {
                'results':     results,
                'count':       count,
                'page':        page,
                'page_size':   page_size,
                'total_pages': total_pages,
                'has_next':    page < total_pages,
                'has_prev':    page > 1,
            },
        },
        status=status.HTTP_200_OK,
    )


# ── Error Responses ───────────────────────────────────────────────────────────

def error_response(
    message:     str  = 'An error occurred.',
    errors:      Any  = None,
    status_code: int  = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """Generic error response."""
    return Response(
        {
            'success': False,
            'message': message,
            'errors':  errors or {},
        },
        status=status_code,
    )


def not_found_response(message: str = 'Resource not found.') -> Response:
    return error_response(message, {}, status.HTTP_404_NOT_FOUND)


def validation_error_response(errors: dict, message: str = 'Validation failed.') -> Response:
    return error_response(message, errors, status.HTTP_400_BAD_REQUEST)


def server_error_response(message: str = 'Internal server error.') -> Response:
    return error_response(message, {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


def forbidden_response(message: str = 'Permission denied.') -> Response:
    return error_response(message, {}, status.HTTP_403_FORBIDDEN)


def unauthorized_response(message: str = 'Authentication required.') -> Response:
    return error_response(message, {}, status.HTTP_401_UNAUTHORIZED)
