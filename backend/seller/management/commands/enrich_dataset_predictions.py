"""
Management command to generate AI Suggested Price, AI Investment Score,
and Appreciation values for all dataset-imported properties that are missing them.

Usage:
    python manage.py enrich_dataset_predictions
    python manage.py enrich_dataset_predictions --limit 100
    python manage.py enrich_dataset_predictions --dry-run
    python manage.py enrich_dataset_predictions --force   # re-run even if values exist
"""

import logging
from datetime import datetime, timezone

from django.core.management.base import BaseCommand

from seller.models.property import Property
from seller.services.prediction_service import PredictionService

logger = logging.getLogger('bricklytics')


def _fmt(val):
    """Quick inline INR formatter for progress logging."""
    if not val:
        return 'Rs.0'
    v = float(val)
    if v >= 10_000_000:
        return f'Rs.{v / 10_000_000:.2f} Cr'
    if v >= 100_000:
        return f'Rs.{v / 100_000:.2f} L'
    return f'Rs.{v:,.0f}'


class Command(BaseCommand):
    help = 'Generate AI predictions (price, investment score, appreciation) for dataset properties missing them.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit', type=int, default=0,
            help='Max number of properties to process (0 = all)'
        )
        parser.add_argument(
            '--dry-run', action='store_true', dest='dry_run',
            help='Compute predictions but do not save to database'
        )
        parser.add_argument(
            '--force', action='store_true',
            help='Re-generate predictions even if values already exist'
        )
        parser.add_argument(
            '--batch', type=int, default=50,
            help='Batch size for progress reporting (default: 50)'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        dry_run = options['dry_run']
        force = options['force']
        batch_size = options['batch']

        service = PredictionService()

        # Build queryset
        qs = Property.objects(status='active', is_deleted=False)
        if not force:
            # Only properties missing AI data
            qs = qs.filter(
                __raw__={'$or': [
                    {'predicted_price': None},
                    {'predicted_price': {'$exists': False}},
                    {'investment_score': None},
                    {'investment_score': {'$exists': False}},
                ]}
            )

        total = qs.count()
        if limit > 0:
            total = min(total, limit)

        if total == 0:
            self.stdout.write(self.style.SUCCESS(
                '[OK] All properties already have AI predictions. Nothing to do.\n'
                '   Use --force to regenerate existing predictions.'
            ))
            return

        self.stdout.write(
            f'{"[DRY RUN] " if dry_run else ""}Processing {total} properties...\n'
        )

        processed = 0
        success = 0
        errors = 0

        docs = qs.limit(limit) if limit > 0 else qs

        for doc in docs:
            try:
                prop_dict = doc.to_dict()
                # Build conditions dict for prediction
                amenities = prop_dict.get('amenities', [])
                amenity_names = []
                for a in amenities:
                    if isinstance(a, dict):
                        amenity_names.append(a.get('name', ''))
                    else:
                        amenity_names.append(getattr(a, 'name', str(a)))

                area = float(prop_dict.get('area_sqft') or 1000)
                price = float(prop_dict.get('price') or 0)
                rate = float(prop_dict.get('rate_per_sqft') or 0)
                if rate <= 0 and price > 0 and area > 0:
                    rate = price / area

                conditions = {
                    'locality': prop_dict.get('locality') or 'Science City',
                    'property_type': prop_dict.get('property_type') or 'flat',
                    'bhk': int(prop_dict.get('bhk') or 2),
                    'area_sqft': area,
                    'rate_per_sqft': rate,
                    'price': price,
                    'latitude': float(prop_dict.get('latitude') or 23.0225),
                    'longitude': float(prop_dict.get('longitude') or 72.5714),
                    'reconstruction_needed': prop_dict.get('reconstruction_needed') or '',
                    'amenities': amenity_names,
                    'builder_name': prop_dict.get('builder_name') or '',
                    'property_age': int(prop_dict.get('property_age') or 2),
                }

                result = service.predict_by_conditions(conditions)
                appr = result.get('appreciation', {})
                inv = result.get('investment', {})

                if not dry_run:
                    doc.predicted_price = result.get('predicted_price')
                    doc.base_ml_price = result.get('base_ml_price')
                    doc.amenity_adjustment = result.get('facility_adjustment')
                    doc.confidence_score = result.get('confidence_score')
                    doc.appreciation_annual_rate = appr.get('annual_rate_percent')
                    doc.appreciation_1yr = (appr.get('estimated_1yr') or {}).get('appreciation_percent')
                    doc.appreciation_3yr = (appr.get('estimated_3yr') or {}).get('appreciation_percent')
                    doc.appreciation_5yr = (appr.get('estimated_5yr') or {}).get('appreciation_percent')
                    doc.future_price_1yr = (appr.get('estimated_1yr') or {}).get('future_estimated_price')
                    doc.future_price_3yr = (appr.get('estimated_3yr') or {}).get('future_estimated_price')
                    doc.future_price_5yr = (appr.get('estimated_5yr') or {}).get('future_estimated_price')
                    doc.investment_score = inv.get('score') or result.get('investment_score')
                    doc.investment_rating = inv.get('rating') or result.get('investment_rating')
                    doc.investment_explanation = inv.get('explanation') or result.get('investment_explanation')
                    doc.investment_reasons = inv.get('reasons') or result.get('investment_reasons') or []
                    doc.prediction_fingerprint = result.get('prediction_fingerprint')
                    doc.appreciation_methodology = appr.get('methodology')
                    doc.prediction_timestamp = datetime.now(timezone.utc)
                    doc.save()

                success += 1
                processed += 1

                if processed % batch_size == 0:
                    self.stdout.write(
                        f'  [{processed}/{total}] Processed {processed} | '
                        f'Latest: {doc.title[:40]} -> Score={inv.get("score") or result.get("investment_score")}, '
                        f'Price={_fmt(result.get("predicted_price") or 0)}'
                    )


            except Exception as e:
                errors += 1
                processed += 1
                if errors <= 10:
                    self.stderr.write(f'  [ERROR] Error on "{getattr(doc, "title", "?")[:40]}": {e}')

        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'\n{prefix}Enrichment complete: {success} succeeded, {errors} errors '
            f'(out of {processed} processed).'
        ))
        if dry_run:
            self.stdout.write('   No changes were saved. Run without --dry-run to persist.')

