"""
seller/management/commands/backfill_predictions.py
===================================================
Backfill missing AI prediction fields on existing properties.

Iterates all properties that are missing one or more AI fields
(predicted_price, investment_score, appreciation_1yr, etc.)
and runs the AI enrichment pipeline to populate them.

Usage:
    python manage.py backfill_predictions
    python manage.py backfill_predictions --dry-run
    python manage.py backfill_predictions --force   # Re-enrich ALL properties
"""

from django.core.management.base import BaseCommand
from seller.models.property import Property


AI_FIELDS = (
    'predicted_price', 'investment_score', 'investment_rating', 'investment_explanation',
    'appreciation_annual_rate', 'appreciation_1yr', 'appreciation_3yr', 'appreciation_5yr',
    'future_price_1yr', 'future_price_3yr', 'future_price_5yr',
)


class Command(BaseCommand):
    help = 'Backfill missing AI prediction fields on properties that lack them.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report what would be updated without saving.')
        parser.add_argument('--force', action='store_true', help='Re-enrich ALL properties, even those with existing values.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        from seller.services.property_service import PropertyService
        service = PropertyService()

        qs = Property.objects(is_deleted__ne=True)
        total = qs.count()
        self.stdout.write(f"Scanning {total} properties...")

        updated = 0
        skipped = 0
        errors = 0

        for doc in qs:
            try:
                data = doc.to_dict()

                # Check if any AI field is missing
                needs_enrichment = force or any(
                    data.get(field) is None for field in AI_FIELDS
                )

                if not needs_enrichment:
                    skipped += 1
                    continue

                if dry_run:
                    missing = [f for f in AI_FIELDS if data.get(f) is None]
                    self.stdout.write(
                        f"  [DRY-RUN] {doc.title} (id={doc.pk}) — missing: {', '.join(missing) if missing else 'force mode'}"
                    )
                    updated += 1
                    continue

                enriched = service._enrich_with_ai_predictions(data)

                # Save only the AI fields
                update_fields = {}
                for field in AI_FIELDS:
                    val = enriched.get(field)
                    if val is not None:
                        update_fields[field] = val

                # Also save supplementary fields
                for extra in ('base_ml_price', 'amenity_adjustment', 'confidence_score',
                              'investment_reasons', 'prediction_fingerprint', 'appreciation_methodology', 'prediction_timestamp'):
                    val = enriched.get(extra)
                    if val is not None:
                        update_fields[extra] = val

                if update_fields:
                    for field, value in update_fields.items():
                        setattr(doc, field, value)
                    doc.save()
                    updated += 1
                    self.stdout.write(self.style.SUCCESS(
                        f"  [OK] Updated: {doc.title} (id={doc.pk}) - {len(update_fields)} fields"
                    ))
                else:
                    skipped += 1

            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(
                    f"  [ERROR] Error on {doc.title} (id={doc.pk}): {e}"
                ))


        prefix = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(self.style.SUCCESS(
            f"\n{prefix}Done. Updated: {updated}, Skipped: {skipped}, Errors: {errors}, Total: {total}"
        ))
