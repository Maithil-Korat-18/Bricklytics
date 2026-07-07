"""
Celery tasks so amenity/traffic fetching doesn't block the request
thread. Wire these up in place of the synchronous calls in views.py
once you have a broker (Redis, per settings.CELERY_BROKER_URL) running:

    from core.tasks import refresh_amenities_task
    refresh_amenities_task.delay(property_id, radius_m)

instead of calling refresh_amenities_for_property() directly.
"""
from celery import shared_task

from core.models import Property
from core.services.geospatial import refresh_amenities_for_property
from core.services.traffic import refresh_traffic_for_property


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def refresh_amenities_task(self, property_id: int, radius_m: int = 2000):
    try:
        prop = Property.objects.get(pk=property_id)
        return refresh_amenities_for_property(prop, radius_m=radius_m)
    except Exception as exc:  # noqa: BLE001 -- retry on any transient failure
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def refresh_traffic_task(self, property_id: int, force: bool = False):
    try:
        prop = Property.objects.get(pk=property_id)
        snapshot = refresh_traffic_for_property(prop, force=force)
        return snapshot.id if snapshot else None
    except Exception as exc:  # noqa: BLE001
        raise self.retry(exc=exc)


@shared_task
def refresh_all_active_properties():
    """Periodic task (wire up via Celery beat) to keep amenity/traffic
    caches warm for every active listing, e.g. nightly for amenities and
    every 15 min for traffic on high-traffic listings."""
    for prop_id in Property.objects.filter(is_active=True).values_list("id", flat=True):
        refresh_amenities_task.delay(prop_id)
        refresh_traffic_task.delay(prop_id)
