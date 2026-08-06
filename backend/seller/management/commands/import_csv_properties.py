"""
Management command to import property_location_amenities.csv into MongoDB.
Usage: python manage.py import_csv_properties
"""

import csv
import math
import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from seller.models.property import Property, PropertyAmenity

logger = logging.getLogger('bricklytics')

POSSIBLE_CSV_PATHS = [
    os.path.join(settings.BASE_DIR.parent, 'property_location_amenities_with_type.csv'),
    os.path.join(settings.BASE_DIR.parent, 'property_location_amenities.csv'),
    os.path.join(settings.BASE_DIR, 'property_location_amenities_with_type.csv'),
    os.path.join(settings.BASE_DIR, 'property_location_amenities.csv'),
]


class Command(BaseCommand):
    help = 'Import properties from property_location_amenities_with_type.csv into MongoDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit', type=int, default=500,
            help='Max number of rows to import (default: 500)'
        )
        parser.add_argument(
            '--clear', action='store_true',
            help='Delete all existing CSV-imported properties before import'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        clear = options['clear']

        csv_path = None
        for path in POSSIBLE_CSV_PATHS:
            if os.path.exists(path):
                csv_path = path
                break

        if not csv_path:
            self.stderr.write(self.style.ERROR(f'No CSV dataset file found at {POSSIBLE_CSV_PATHS[0]}'))
            return

        if clear:
            deleted = Property.objects(
                __raw__={'$or': [
                    {'is_dataset_import': True},
                    {'project_name': 'CSV_IMPORT'},
                    {'seller_name': 'Bricklytics Listings'},
                ]}
            ).delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} previously imported CSV dataset properties.'))

        # Check existing count to avoid re-import
        existing = Property.objects(is_dataset_import=True).count()
        if existing > 0 and not clear:
            self.stdout.write(self.style.WARNING(
                f'{existing} CSV properties already imported. Use --clear to reimport.'
            ))
            return

        self.stdout.write(f'Reading CSV from: {csv_path}')

        imported = 0
        skipped = 0
        errors = 0

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
                if imported >= limit:
                    break

                try:
                    price_cr = float(row.get('price', 0) or 0)
                    price_inr = price_cr * 10000000  # Convert Cr to INR

                    if price_inr <= 0:
                        skipped += 1
                        continue

                    bhk = int(row.get('bhk', 2) or 2)
                    rate_per_sqft = float(row.get('rate per sqft', 4000) or 4000)
                    area_sqft = float(row.get('area per sqft', 1200) or 1200)
                    lat = float(row.get('lat', 23.0225) or 23.0225)
                    lon = float(row.get('lon', 72.5714) or 72.5714)

                    property_name = (row.get('property name') or 'Ahmedabad Property').strip().title()
                    location = (row.get('location') or 'Ahmedabad').strip().title()
                    matched_name = (row.get('matched map name') or location).strip().title()

                    raw_type = str(row.get('property type') or row.get('property_type') or 'apartment').lower().strip()
                    if 'villa' in raw_type or 'house' in raw_type:
                        p_type = 'villa'
                    elif 'plot' in raw_type or 'land' in raw_type:
                        p_type = 'plot'
                    else:
                        p_type = 'apartment'

                    # Build amenities from nearby data
                    amenities = []
                    nearby_fields = {
                        'nearby school': 'Education',
                        'nearby hospital': 'Healthcare',
                        'nearby bank': 'Finance',
                        'nearby public transport': 'Transport',
                        'nearby railway station': 'Transport',
                    }
                    for field, category in nearby_fields.items():
                        val = row.get(field, '').strip()
                        if val:
                            amenities.append(PropertyAmenity(name=val, category=category))

                    # Standard amenities
                    for am in ['24/7 Security', 'Power Backup', 'Covered Parking', 'Elevators']:
                        amenities.append(PropertyAmenity(name=am, category='General'))

                    prop = Property(
                        title=property_name,
                        description=f'Premium {bhk} BHK property in {property_name}, {matched_name}, Ahmedabad. '
                                    f'Area: {area_sqft} sqft at ₹{rate_per_sqft}/sqft. '
                                    f'Located near top schools, hospitals, and public transport.',
                        property_type=p_type,
                        listing_type='sell',
                        sale_type='new' if price_cr < 1.5 else 'resale',
                        price=price_inr,
                        rate_per_sqft=rate_per_sqft,
                        bhk=bhk,
                        bedrooms=bhk,
                        bathrooms=max(1, bhk - 1),
                        balconies=min(bhk, 3),
                        area_sqft=area_sqft,
                        floor_number=1,
                        total_floors=10,
                        property_age=2,
                        facing='East',
                        furnishing='Semi-Furnished',
                        parking='Yes',
                        address=f'{property_name}, {matched_name}',
                        locality=matched_name,
                        city='Ahmedabad',
                        state='Gujarat',
                        pincode='380001',
                        latitude=lat,
                        longitude=lon,
                        builder_name='Verified Builder',
                        project_name=property_name,  # Real society name instead of CSV_IMPORT
                        is_dataset_import=True,
                        rera_number=f'PR/GJ/AHD/2025/{10000 + imported}',
                        possession_status='Ready',
                        seller_name='Bricklytics Listings',
                        phone_number='+91 79 2600 0000',
                        email='listings@bricklytics.com',
                        amenities=amenities,
                        images=[],
                        brochures=[],
                        predictions=[],
                        status='active',
                    )
                    prop.save()
                    imported += 1

                    if imported % 100 == 0:
                        self.stdout.write(f'  Imported {imported} properties...')

                except Exception as e:

                    errors += 1
                    if errors <= 5:
                        self.stderr.write(f'  Error on row: {e}')

        self.stdout.write(self.style.SUCCESS(
            f'\nImport complete: {imported} imported, {skipped} skipped, {errors} errors.'
        ))

