"""
core/middleware/error_handler.py — Global Error Handler Middleware
==================================================================
Catches any unhandled Python exceptions that bubble past DRF's
exception handler and returns a safe 500 JSON response instead of
an HTML error page.
"""

import json
import logging
import traceback

logger = logging.getLogger('bricklytics')

_500_BODY = json.dumps({
    'success': False,
    'message': 'An internal server error occurred.',
    'errors':  {},
}).encode('utf-8')


class GlobalErrorHandlerMiddleware:
    """Last-resort middleware — converts unhandled exceptions to JSON 500."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except (BrokenPipeError, ConnectionResetError) as exc:
            logger.warning('Client disconnected before response sent on %s %s: %s', request.method, request.path, exc)
            from django.http import HttpResponse
            return HttpResponse(status=499)
        except Exception as exc:
            logger.exception('Unhandled exception on %s %s: %s', request.method, request.path, exc)
            from django.http import HttpResponse
            return HttpResponse(
                _500_BODY,
                status=500,
                content_type='application/json',
            )
