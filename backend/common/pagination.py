"""
common/pagination.py — Standard Pagination Classes
===================================================
Used by DRF's DEFAULT_PAGINATION_CLASS in settings.py.
"""

import math

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Standard paginator: ?page=1&page_size=20

    Returns:
        {
            "success": true,
            "message": "...",
            "data": {
                "results":     [...],
                "count":       100,
                "page":        1,
                "page_size":   20,
                "total_pages": 5,
                "has_next":    true,
                "has_prev":    false
            }
        }
    """

    page_size             = 20
    page_size_query_param = 'page_size'
    max_page_size         = 100
    page_query_param      = 'page'

    def get_paginated_response(self, data) -> Response:
        page        = self.page.number
        page_size   = self.get_page_size(self.request)
        count       = self.page.paginator.count
        total_pages = math.ceil(count / page_size) if page_size else 1

        return Response({
            'success': True,
            'message': 'Data fetched successfully.',
            'data': {
                'results':     data,
                'count':       count,
                'page':        page,
                'page_size':   page_size,
                'total_pages': total_pages,
                'has_next':    self.page.has_next(),
                'has_prev':    self.page.has_previous(),
            },
        })

    def get_paginated_response_schema(self, schema):
        """OpenAPI schema hint for paginated responses."""
        return {
            'type': 'object',
            'properties': {
                'success':     {'type': 'boolean'},
                'message':     {'type': 'string'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'results':     schema,
                        'count':       {'type': 'integer'},
                        'page':        {'type': 'integer'},
                        'page_size':   {'type': 'integer'},
                        'total_pages': {'type': 'integer'},
                        'has_next':    {'type': 'boolean'},
                        'has_prev':    {'type': 'boolean'},
                    },
                },
            },
        }


class LargeResultsPagination(StandardResultsPagination):
    """For endpoints that need larger page sizes (e.g., exports)."""
    page_size     = 50
    max_page_size = 500
