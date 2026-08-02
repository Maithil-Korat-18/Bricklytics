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

CSV_PATH = os.path.join(settings.BASE_DIR.parent, 'property_location_amenities.csv')


class Command(BaseCommand):
    help = 'Import properties from property_location_amenities.csv into MongoDB'

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

        if not os.path.exists(CSV_PATH):
            self.stderr.write(self.style.ERROR(f'CSV file not found at: {CSV_PATH}'))
            return

        if clear:
            deleted = Property.objects(project_name='CSV_IMPORT').delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} previously imported CSV properties.'))

        # Check existing count to avoid re-import
        existing = Property.objects(project_name='CSV_IMPORT').count()
        if existing > 0 and not clear:
            self.stdout.write(self.style.WARNING(
                f'{existing} CSV properties already imported. Use --clear to reimport.'
            ))
            return

        self.stdout.write(f'Reading CSV from: {CSV_PATH}')

        imported = 0
        skipped = 0
        errors = 0

        with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
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
                        description=f'Premium {bhk} BHK apartment in {property_name}, {matched_name}, Ahmedabad. '
                                    f'Area: {area_sqft} sqft at ₹{rate_per_sqft}/sqft. '
                                    f'Located near top schools, hospitals, and public transport.',
                        property_type='apartment',
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
                        project_name='CSV_IMPORT',  # Tag for identification
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
            f'\n✅ Import complete: {imported} imported, {skipped} skipped, {errors} errors.'
        ))
