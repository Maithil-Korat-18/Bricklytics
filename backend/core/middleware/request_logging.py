"""
core/middleware/request_logging.py — API Request/Response Logger
================================================================
Logs each incoming HTTP request and its response status + duration.

Log format (JSON via JSONFormatter):
  {
    "method": "POST",
    "path": "/api/seller/properties/",
    "status": 201,
    "duration_ms": 45.3,
    "ip": "127.0.0.1"
  }
"""

import logging
import time

logger = logging.getLogger('bricklytics.api')

# Paths to skip logging (health checks, static files, etc.)
_SKIP_PATHS: tuple[str, ...] = (
    '/api/health/',
    '/static/',
    '/media/',
    '/favicon.ico',
)


class RequestLoggingMiddleware:
    """WSGI middleware that logs every API request with timing info."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip noisy paths
        if any(request.path.startswith(p) for p in _SKIP_PATHS):
            return self.get_response(request)

        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)

        logger.info(
            '%s %s -> %s  (%.2f ms)  ip=%s',
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            _get_client_ip(request),
            extra={
                'method':      request.method,
                'path':        request.path,
                'status':      response.status_code,
                'duration_ms': duration_ms,
                'ip':          _get_client_ip(request),
            },
        )
        return response


def _get_client_ip(request) -> str:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')
