"""
Management command to import properties from property_location_amenities_with_type.csv into MongoDB.
Populates pre-computed AI predictions (v5 log-space model), AI investment scores, appreciation rates,
and curated Unsplash images for instant buyer-side response.

Usage:
    python manage.py import_csv_properties --clear --limit 3000
"""

import csv
import math
import os
import logging
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.conf import settings
from seller.models.property import Property, PropertyAmenity, PropertyImage
from seller.services.prediction_service import PredictionService

logger = logging.getLogger('bricklytics')

POSSIBLE_CSV_PATHS = [
    os.path.join(settings.BASE_DIR.parent, 'property_location_amenities_with_type.csv'),
    os.path.join(settings.BASE_DIR.parent, 'property_location_amenities.csv'),
    os.path.join(settings.BASE_DIR, 'property_location_amenities_with_type.csv'),
    os.path.join(settings.BASE_DIR, 'property_location_amenities.csv'),
]

APARTMENT_COVER_IMAGES = [
    f"/media/properties/whatsapp/whatsapp_cover_{i}.jpeg" for i in range(1, 27)
]
APARTMENT_NEW_IMAGES = APARTMENT_COVER_IMAGES
APARTMENT_RESALE_IMAGES = APARTMENT_COVER_IMAGES

VILLA_NEW_IMAGES = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1200",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1200",
]

VILLA_RESALE_IMAGES = [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1200",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=1200",
]

COMMERCIAL_IMAGES = [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200",
]

PLOT_IMAGES = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200",
    "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?q=80&w=1200",
]


class Command(BaseCommand):
    help = 'Import properties from CSV into MongoDB with precomputed v5 AI predictions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit', type=int, default=2000,
            help='Max number of rows to import (default: 2000)'
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

        existing = Property.objects(is_dataset_import=True).count()
        if existing > 0 and not clear:
            self.stdout.write(self.style.WARNING(
                f'{existing} CSV properties already imported. Use --clear to reimport.'
            ))
            return

        self.stdout.write(f'Reading CSV from: {csv_path} (Limit: {limit})')

        prediction_service = PredictionService()
        imported = 0
        skipped = 0
        errors = 0
        batch = []
        batch_size = 250

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
                if imported >= limit:
                    break

                try:
                    price_cr = float(row.get('price', 0) or 0)
                    price_inr = price_cr * 10_000_000.0  # Convert Cr to INR

                    if price_inr <= 0 or price_cr > 30.0:
                        skipped += 1
                        continue

                    bhk = int(row.get('bhk', 2) or 2)
                    rate_per_sqft = float(row.get('rate per sqft', 4000) or 4000)
                    area_sqft = float(row.get('area per sqft', 1200) or 1200)

                    if area_sqft < 150 or area_sqft > 15000 or bhk < 1 or bhk > 10:
                        skipped += 1
                        continue

                    lat = float(row.get('lat', 23.0225) or 23.0225)
                    lon = float(row.get('lon', 72.5714) or 72.5714)

                    if not (20.0 <= lat <= 26.0 and 70.0 <= lon <= 75.0):
                        skipped += 1
                        continue

                    property_name = (row.get('property name') or 'Ahmedabad Property').strip().title()
                    location = (row.get('location') or 'Ahmedabad').strip().title()
                    matched_name = (row.get('matched map name') or location).strip().title()

                    raw_type = str(row.get('property type') or row.get('property_type') or 'apartment').lower().strip()
                    if any(k in raw_type for k in ['villa', 'house', 'bungalow', 'duplex']):
                        p_type = 'villa'
                    elif any(k in raw_type for k in ['plot', 'land']):
                        p_type = 'plot'
                    elif any(k in raw_type for k in ['commercial', 'office', 'shop', 'retail']):
                        p_type = 'commercial'
                    else:
                        p_type = 'apartment'

                    sale_type = 'new' if price_cr < 1.5 else 'resale'

                    # Amenities
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

                    for am in ['24/7 Security', 'Power Backup', 'Covered Parking', 'Elevators']:
                        amenities.append(PropertyAmenity(name=am, category='General'))

                    # Select curated photos strictly matching property_type and sale_type
                    if p_type == 'villa':
                        img_pool = VILLA_NEW_IMAGES if sale_type == 'new' else VILLA_RESALE_IMAGES
                    elif p_type == 'plot':
                        img_pool = PLOT_IMAGES
                    elif p_type == 'commercial':
                        img_pool = COMMERCIAL_IMAGES
                    else:
                        img_pool = APARTMENT_NEW_IMAGES if sale_type == 'new' else APARTMENT_RESALE_IMAGES

                    selected_imgs = [
                        PropertyImage(
                            id=f'img_{imported}_{idx}',
                            url=img_pool[(imported + idx) % len(img_pool)],
                            file_path=img_pool[(imported + idx) % len(img_pool)],
                            is_cover=(idx == 0),
                            caption=f'{property_name} View {idx + 1}'
                        ) for idx in range(min(3, len(img_pool)))
                    ]

                    # Precompute v5 AI predictions
                    conditions = {
                        'property_type': p_type,
                        'bhk': bhk,
                        'area_sqft': area_sqft,
                        'latitude': lat,
                        'longitude': lon,
                        'locality': matched_name,
                        'price': price_inr,
                    }
                    pred_res = prediction_service.predict_by_conditions(conditions)
                    appr = pred_res.get('appreciation', {})
                    inv = pred_res.get('investment', {})

                    prop = Property(
                        title=f'{bhk} BHK {p_type.title()} in {matched_name}',
                        description=f'Premium {bhk} BHK {p_type} in {property_name}, {matched_name}, Ahmedabad. '
                                    f'Spacious area of {area_sqft:,.0f} sqft at ₹{rate_per_sqft:,.0f}/sqft. '
                                    f'Excellent connectivity to schools, healthcare, and city transport.',
                        property_type=p_type,
                        listing_type='sell',
                        sale_type=sale_type,
                        price=price_inr,
                        rate_per_sqft=rate_per_sqft,
                        bhk=bhk,
                        bedrooms=bhk,
                        bathrooms=max(1, bhk - 1),
                        balconies=min(bhk, 3),
                        area_sqft=area_sqft,
                        floor_number=1 + (imported % 12),
                        total_floors=14,
                        property_age=1 + (imported % 8),
                        facing=['East', 'North-East', 'North', 'West'][imported % 4],
                        furnishing=['Semi-Furnished', 'Furnished', 'Unfurnished'][imported % 3],
                        parking='Covered',
                        address=f'{property_name}, {matched_name}, Ahmedabad',
                        locality=matched_name,
                        city='Ahmedabad',
                        state='Gujarat',
                        pincode='380001',
                        latitude=lat,
                        longitude=lon,
                        builder_name='Verified Ahmedabad Developer',
                        project_name=property_name,
                        is_dataset_import=True,
                        rera_number=f'PR/GJ/AHD/2025/{10000 + imported}',
                        possession_status='Ready to Move',
                        seller_name='Bricklytics Verified Listings',
                        phone_number='+91 79 2600 0000',
                        email='listings@bricklytics.com',
                        amenities=amenities,
                        images=selected_imgs,
                        status='active',
                        # Precomputed v5 predictions
                        predicted_price=pred_res.get('predicted_price'),
                        base_ml_price=pred_res.get('base_ml_price'),
                        amenity_adjustment=pred_res.get('facility_adjustment'),
                        confidence_score=92.5,
                        appreciation_annual_rate=appr.get('annual_rate_percent'),
                        appreciation_1yr=(appr.get('estimated_1yr') or {}).get('appreciation_percent'),
                        appreciation_3yr=(appr.get('estimated_3yr') or {}).get('appreciation_percent'),
                        appreciation_5yr=(appr.get('estimated_5yr') or {}).get('appreciation_percent'),
                        future_price_1yr=(appr.get('estimated_1yr') or {}).get('future_estimated_price'),
                        future_price_3yr=(appr.get('estimated_3yr') or {}).get('future_estimated_price'),
                        future_price_5yr=(appr.get('estimated_5yr') or {}).get('future_estimated_price'),
                        investment_score=inv.get('score') or pred_res.get('investment_score'),
                        investment_rating=inv.get('rating') or pred_res.get('investment_rating'),
                        investment_explanation=inv.get('explanation') or pred_res.get('investment_explanation'),
                        investment_reasons=inv.get('reasons') or pred_res.get('investment_reasons') or [],
                        prediction_fingerprint=pred_res.get('prediction_fingerprint'),
                        appreciation_methodology=appr.get('methodology'),
                        prediction_timestamp=datetime.now(timezone.utc),
                    )
                    batch.append(prop)
                    imported += 1

                    if len(batch) >= batch_size:
                        Property.objects.insert(batch, load_bulk=False)
                        batch = []
                        self.stdout.write(f'  Successfully imported and enriched {imported}/{limit} properties...')

                except Exception as e:
                    errors += 1
                    if errors <= 5:
                        self.stderr.write(f'  Error on row {imported}: {e}')

        if batch:
            Property.objects.insert(batch, load_bulk=False)
            self.stdout.write(f'  Successfully imported and enriched {imported}/{limit} properties...')

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Bulk Import complete: {imported} imported & enriched with v5 predictions, '
            f'{skipped} skipped, {errors} errors.'
        ))
