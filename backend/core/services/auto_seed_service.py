"""
core/services/auto_seed_service.py — Automatic Database Seeder & Health Engine
================================================================================
Ensures that whenever the server restarts or starts with an empty/fresh MongoDB,
500 dataset properties and seller accounts/listings are automatically imported,
seeded, and enriched in the background.
"""

import logging
import threading

logger = logging.getLogger('bricklytics')
_seeding_lock = threading.Lock()
_seeded_checked = False


def ensure_database_seeded(force: bool = False) -> None:
    """
    Checks if active properties exist in MongoDB.
    If database is empty or active properties < 10, automatically seeds 500 properties.
    """
    global _seeded_checked

    if _seeded_checked and not force:
        return

    with _seeding_lock:
        if _seeded_checked and not force:
            return

        try:
            from seller.models.property import Property
            active_count = Property.objects(status='active', is_deleted=False).count()

            if active_count < 10 or force:
                logger.info("Initializing/Seeding database (active count: %d)...", active_count)
                
                # 1. Import 500 dataset properties
                from django.core.management import call_command
                call_command('import_csv_properties', limit=500, clear=True)

                # 2. Seed seller 1 and seller 2 accounts and rich properties
                try:
                    import seed_sellers_and_properties
                    seed_sellers_and_properties.seed()
                except Exception as exc:
                    logger.warning("Error running seed_sellers_and_properties: %s", exc)

                # 3. Enrich dataset predictions
                call_command('enrich_dataset_predictions', limit=550)

                new_count = Property.objects(status='active', is_deleted=False).count()
                logger.info("Database auto-seeding complete! Active property count: %d", new_count)

            _seeded_checked = True

        except Exception as err:
            logger.error("Auto-seeding database check failed: %s", err, exc_info=True)


def start_auto_seed_in_background() -> None:
    """Run auto-seeding asynchronously so server startup is non-blocking."""
    thread = threading.Thread(target=ensure_database_seeded, daemon=True)
    thread.start()
