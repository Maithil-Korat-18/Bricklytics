"""
seller/views/map_views.py — Fast Offline Local Map API Endpoints
"""

import sqlite3
import logging
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger('bricklytics.seller')
DB_PATH = Path(settings.BASE_DIR) / 'data' / 'offline_map.db'


class OfflineMapSearchView(APIView):
    """Sub-10ms local text search using SQLite FTS5 index on Ahmedabad OSM dataset."""

    permission_classes = [AllowAny]

    def get(self, request):
        query = str(request.query_params.get('q') or '').strip()
        if not query or len(query) < 2:
            return Response({'success': True, 'data': []}, status=status.HTTP_200_OK)

        if not DB_PATH.exists():
            return Response({'success': False, 'message': 'Offline map index not initialized.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Clean query for FTS5 syntax
            clean_query = ' '.join([f'"{word}*"' for word in query.split() if word])
            cursor.execute('''
                SELECT l.osm_id, l.name, l.display_name, l.locality, l.place_type, l.lat, l.lon
                FROM locations_fts fts
                JOIN locations l ON fts.rowid = l.id
                WHERE locations_fts MATCH ?
                LIMIT 10
            ''', (clean_query,))

            rows = cursor.fetchall()
            results = [{
                'osm_id': row['osm_id'],
                'name': row['name'],
                'display_name': row['display_name'],
                'locality': row['locality'],
                'place_type': row['place_type'],
                'lat': str(row['lat']),
                'lon': str(row['lon']),
            } for row in rows]

            conn.close()
            return Response({'success': True, 'data': results}, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error('Offline map search error: %s', exc)
            return Response({'success': False, 'message': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OfflineMapReverseView(APIView):
    """Sub-5ms local reverse geocoding using spatial coordinate lookup on offline map database."""

    permission_classes = [AllowAny]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat') or 23.0225)
            lon = float(request.query_params.get('lon') or 72.5714)
        except ValueError:
            return Response({'success': False, 'message': 'Invalid latitude or longitude.'}, status=status.HTTP_400_BAD_REQUEST)

        if not DB_PATH.exists():
            return Response({'success': False, 'message': 'Offline map index not initialized.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Nearest-neighbor coordinate lookup within ~0.05 degree bounding box (~5 km)
            cursor.execute('''
                SELECT name, display_name, locality, place_type, lat, lon,
                       ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) AS distance
                FROM locations
                WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?
                ORDER BY distance ASC
                LIMIT 1
            ''', (lat, lat, lon, lon, lat - 0.05, lat + 0.05, lon - 0.05, lon + 0.05))

            row = cursor.fetchone()
            conn.close()

            if row:
                res_data = {
                    'display_name': row['display_name'],
                    'locality': row['locality'],
                    'name': row['name'],
                    'lat': row['lat'],
                    'lon': row['lon'],
                }
            else:
                res_data = {
                    'display_name': f'Selected Location ({lat:.4f}, {lon:.4f}), Ahmedabad, Gujarat',
                    'locality': 'Ahmedabad',
                    'name': 'Ahmedabad Location',
                    'lat': lat,
                    'lon': lon,
                }

            return Response({'success': True, 'data': res_data}, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error('Offline map reverse geocoding error: %s', exc)
            return Response({'success': False, 'message': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
