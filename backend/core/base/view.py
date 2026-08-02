"""
core/base/view.py — Base API View Class
"""

import logging
from rest_framework.views import APIView
from common.responses import success_response, created_response, error_response


class BaseAPIView(APIView):
    """
    Base view providing standard loggers and standardized response formatting helpers.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.logger = logging.getLogger('bricklytics.api')

    def success_response(self, data=None, message="Success", status_code=200):
        return success_response(data=data, message=message, status_code=status_code)

    def created_response(self, data=None, message="Resource created successfully"):
        return created_response(data=data, message=message)

    def error_response(self, message="Error", errors=None, status_code=400):
        return error_response(message=message, errors=errors, status_code=status_code)

    def handle_exception(self, exc):
        """Log all exceptions before delegating to DRF's handler."""
        self.logger.exception('Exception in %s: %s', self.__class__.__name__, exc)
        return super().handle_exception(exc)
