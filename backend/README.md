# Property Intelligence System — Backend

Django + GeoDjango/PostGIS backend implementing the Location Intelligence
fetchers, Traffic & Congestion analysis, and the Priority-Based scoring
engine described in the project spec.

## Stack

- **Django 5 + Django REST Framework** — API layer
- **GeoDjango + PostGIS** — spatial storage/queries (distance ordering,
  radius filters) at the database level instead of in Python
- **Overpass API** (default, free) or **Google Places API** (paid,
  optional) — amenity data: schools, hospitals, police/fire, transit
- **TomTom** (default) or **HERE** — real-time traffic/congestion
- **Celery + Redis** (optional, recommended for production) — async
  fetch so scoring requests don't block on external API latency

## Setup

1. Install PostgreSQL with the PostGIS extension enabled, and Redis if
   you plan to use Celery.
2. `python -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `cp .env.example .env` and fill in DB credentials + API keys
   (Overpass needs no key; TomTom/HERE and Google Places do).
5. `python manage.py migrate`
6. `python manage.py createsuperuser`
7. `python manage.py runserver`

## Project layout

```
property_intelligence/
  settings.py          # GeoDjango, DRF, provider config, cache TTLs
  urls.py
core/
  models.py            # Property, Amenity, PropertyAmenityLink,
                        # TrafficSnapshot, UserPreferenceProfile, MatchScore
  services/
    geospatial.py       # "The Fetchers" — Overpass/Google amenity search
    traffic.py          # TomTom/HERE congestion & commute-time lookup
    scoring.py          # "The Recommender" — normalization + weighting
  views.py              # DRF viewsets + scoring/ranking endpoints
  serializers.py
  urls.py
  admin.py
  tasks.py              # Celery wrappers for async fetch
```

## How the pieces fit together

1. **Fetch**: `refresh_amenities_for_property()` queries Overpass (or
   Google Places) for each amenity subtype within a radius, upserts
   `Amenity` rows, and caches a `PropertyAmenityLink` with the computed
   distance. Re-fetching is skipped if a fresh-enough link already
   exists (`AMENITY_CACHE_TTL_HOURS`, default 7 days — amenity locations
   rarely change).
2. **Traffic**: `refresh_traffic_for_property()` hits TomTom/HERE for
   the flow segment nearest the property and stores a `TrafficSnapshot`.
   Cached for `TRAFFIC_CACHE_TTL_MINUTES` (default 15) since congestion
   is time-of-day dependent.
3. **Score**: `compute_match_score()` reads the cached links/snapshot,
   applies an exponential distance-decay normalization per category
   (tunable half-life — a hospital 3km away still matters more than a
   bus stop 3km away), multiplies by the user's per-category weight
   from `UserPreferenceProfile`, and stores the result + full breakdown
   in `MatchScore`.
4. **Rank**: `rank_properties()` scores a list of properties and sorts
   them highest-to-lowest.

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/properties/?lat=&lon=&radius_km=` | List properties, optionally ordered by distance from a point |
| `POST` | `/api/v1/properties/{id}/refresh_amenities/` | Force a fetch of nearby amenities |
| `GET` | `/api/v1/properties/{id}/amenities/?category=` | Cached amenity links for a property |
| `GET` | `/api/v1/properties/{id}/traffic/?force=true` | Current/cached traffic snapshot |
| `GET`/`POST` | `/api/v1/preference-profiles/` | CRUD for a user's weight profiles |
| `GET` | `/api/v1/properties/{id}/match-score/?profile_id=` | Personalized score + breakdown for one property |
| `GET` | `/api/v1/properties/ranked/?profile_id=&lat=&lon=&radius_km=` | Main search endpoint: ranked properties by match score |

## Notes on scaling this further

- Move `refresh_amenities_for_property` / `refresh_traffic_for_property`
  calls in `views.py` to the Celery tasks in `tasks.py` once you have
  real traffic volume — Overpass calls across 11 subtypes can take
  several seconds synchronously.
- The scoring engine's normalization curve and category half-lives
  live at the top of `core/services/scoring.py` — tune those constants
  rather than the algorithm itself as you get real user feedback on
  what "close enough" means per category.
- Consider a `ScoringVersion` field on `MatchScore` if you expect to
  iterate on the algorithm — lets you A/B test scoring changes without
  invalidating all cached scores at once.
