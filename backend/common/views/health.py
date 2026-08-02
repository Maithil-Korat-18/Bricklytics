"""
common/views/health.py — Health Check Endpoint
===============================================
GET /api/health/

Returns:
    {
        "success": true,
        "message": "Bricklytics API is healthy.",
        "data": {
            "status":   "ok",
            "database": "connected",
            "version":  "1.0.0"
        }
    }
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('bricklytics.api')


class HealthCheckView(APIView):
    """Simple health check — used by load balancers and monitoring."""

    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        db_status = self._check_db()

        data = {
            'status':   'ok' if db_status == 'connected' else 'degraded',
            'database': db_status,
            'version':  '1.0.0',
        }

        http_status = (
            status.HTTP_200_OK if data['status'] == 'ok'
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(
            {
                'success': data['status'] == 'ok',
                'message': 'Bricklytics API is healthy.' if data['status'] == 'ok'
                           else 'Service degraded — database unavailable.',
                'data': data,
            },
            status=http_status,
        )

    def _check_db(self) -> str:
        try:
            import mongoengine
            mongoengine.connection.get_db()
            return 'connected'
        except Exception as exc:
            logger.warning('Health check — DB unreachable: %s', exc)
            return 'disconnected'
