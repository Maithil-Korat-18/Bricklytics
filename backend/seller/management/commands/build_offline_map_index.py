"""
Management command to parse raw OpenStreetMap XML file ('map') and build an indexed
SQLite database ('backend/data/offline_map.db') for sub-15ms local search and reverse geocoding.

Usage: python manage.py build_offline_map_index
"""

import os
import sqlite3
import xml.etree.ElementTree as ET
import logging
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger('bricklytics')

POSSIBLE_MAP_PATHS = [
    Path(settings.BASE_DIR.parent) / 'map',
    Path(settings.BASE_DIR) / 'map',
]


class Command(BaseCommand):
    help = 'Build indexed local SQLite database from OpenStreetMap dataset for fast offline search & reverse geocoding'

    def add_arguments(self, parser):
        parser.add_argument(
            '--rebuild', action='store_true',
            help='Rebuild the offline map database even if it already exists'
        )

    def handle(self, *args, **options):
        rebuild = options['rebuild']
        map_path = None
        for p in POSSIBLE_MAP_PATHS:
            if p.exists():
                map_path = p
                break

        if not map_path:
            self.stderr.write(self.style.ERROR(f'Map XML file not found at {POSSIBLE_MAP_PATHS[0]}'))
            return

        db_dir = Path(settings.BASE_DIR) / 'data'
        db_dir.mkdir(parents=True, exist_ok=True)
        db_path = db_dir / 'offline_map.db'

        if db_path.exists() and not rebuild:
            self.stdout.write(self.style.SUCCESS(f'Offline map index already exists at {db_path}. Use --rebuild to recreate.'))
            return

        if db_path.exists():
            db_path.unlink()

        self.stdout.write(f'Parsing OpenStreetMap XML data from: {map_path} (size: {map_path.stat().st_size / 1e6:.1f} MB)')

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create schema
        cursor.execute('''
            CREATE TABLE locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                osm_id TEXT,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                locality TEXT,
                place_type TEXT,
                lat REAL NOT NULL,
                lon REAL NOT NULL
            )
        ''')
        cursor.execute('CREATE INDEX idx_locations_lat_lon ON locations(lat, lon);')

        # Create SQLite FTS5 Virtual Table for full-text search
        cursor.execute('''
            CREATE VIRTUAL TABLE locations_fts USING fts5(
                name,
                display_name,
                locality,
                content='locations',
                content_rowid='id'
            )
        ''')

        # Stream parse XML to keep memory usage low
        count = 0
        batch = []
        node_coords = {}  # Cache node coords for way centroid calculation (sample subset)

        # First pass / iterparse
        context = ET.iterparse(map_path, events=('end',))
        for event, elem in context:
            if elem.tag == 'node':
                lat = float(elem.attrib.get('lat', 0))
                lon = float(elem.attrib.get('lon', 0))
                osm_id = elem.attrib.get('id', '')

                # Store coords in cache for way lookup
                if count < 300000:
                    node_coords[osm_id] = (lat, lon)

                tags = {}
                for tag in elem.findall('tag'):
                    k = tag.attrib.get('k')
                    v = tag.attrib.get('v')
                    if k and v:
                        tags[k] = v

                name = tags.get('name') or tags.get('name:en') or tags.get('addr:street') or tags.get('addr:housename')
                if name:
                    locality = tags.get('addr:suburb') or tags.get('addr:district') or tags.get('place') or 'Ahmedabad'
                    place_type = tags.get('place') or tags.get('amenity') or tags.get('highway') or tags.get('building') or 'location'
                    
                    full_addr = tags.get('addr:full')
                    if full_addr:
                        display_name = f"{full_addr}, Gujarat"
                    else:
                        display_name = f"{name}, {locality}, Ahmedabad, Gujarat"

                    batch.append((osm_id, name, display_name, locality, place_type, lat, lon))
                    count += 1

                elem.clear()

                if len(batch) >= 5000:
                    cursor.executemany(
                        'INSERT INTO locations (osm_id, name, display_name, locality, place_type, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        batch
                    )
                    batch = []
                    self.stdout.write(f'  Indexed {count} location nodes...')

            elif elem.tag == 'way':
                tags = {t.attrib.get('k'): t.attrib.get('v') for t in elem.findall('tag') if t.attrib.get('k') and t.attrib.get('v')}
                name = tags.get('name') or tags.get('name:en')
                if name:
                    nd_refs = [nd.attrib.get('ref') for nd in elem.findall('nd') if nd.attrib.get('ref')]
                    coords = [node_coords[ref] for ref in nd_refs if ref in node_coords]
                    if coords:
                        avg_lat = sum(c[0] for c in coords) / len(coords)
                        avg_lon = sum(c[1] for c in coords) / len(coords)
                        osm_id = elem.attrib.get('id', '')
                        locality = tags.get('addr:suburb') or tags.get('place') or 'Ahmedabad'
                        place_type = tags.get('highway') or tags.get('building') or 'way'
                        display_name = f"{name}, {locality}, Ahmedabad, Gujarat"
                        batch.append((osm_id, name, display_name, locality, place_type, avg_lat, avg_lon))
                        count += 1

                elem.clear()

        if batch:
            cursor.executemany(
                'INSERT INTO locations (osm_id, name, display_name, locality, place_type, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)',
                batch
            )

        conn.commit()

        # Populate FTS5 index
        self.stdout.write('Building FTS5 full-text search index...')
        cursor.execute('''
            INSERT INTO locations_fts(rowid, name, display_name, locality)
            SELECT id, name, display_name, locality FROM locations
        ''')
        conn.commit()
        conn.close()

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully created offline map index at {db_path} with {count} indexed locations.'
        ))
