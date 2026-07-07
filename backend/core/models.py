"""
Data models for the Property Intelligence System.

Design notes
------------
- Property and Amenity both use GeoDjango's PointField so PostGIS can do
  fast spatial lookups (ST_DWithin / distance ordering) instead of pulling
  every row into Python and computing haversine distances by hand.
- AmenityCategory is a fixed set of metric buckets (education, safety,
  healthcare, mobility). Weights and raw scores are always keyed off this
  enum so the scoring engine has a stable contract with the fetchers.
- Raw fetched amenities are cached per-property (AMENITY_CACHE_TTL_HOURS)
  because amenity locations rarely change, while TrafficSnapshot is cached
  for a much shorter window since congestion is time-of-day dependent.
- MatchScore stores the *result* of a scoring run for a (property, user)
  pair so repeated requests (e.g. re-sorting a list) don't recompute
  everything, and so we can show the user a score breakdown.
"""
from django.contrib.gis.db import models as gis_models
from django.contrib.auth import get_user_model
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class AmenityCategory(models.TextChoices):
    EDUCATION = "education", "Education"
    SAFETY = "safety", "Emergency & Safety"
    HEALTHCARE = "healthcare", "Healthcare"
    MOBILITY = "mobility", "Mobility / Transit"
    TRAFFIC = "traffic", "Traffic & Congestion"


class AmenitySubtype(models.TextChoices):
    SCHOOL = "school", "School"
    COLLEGE = "college", "College"
    DAYCARE = "daycare", "Daycare"
    FIRE_STATION = "fire_station", "Fire Station"
    POLICE_STATION = "police_station", "Police Station"
    HOSPITAL = "hospital", "Hospital"
    PHARMACY = "pharmacy", "Pharmacy"
    URGENT_CARE = "urgent_care", "Urgent Care Clinic"
    SUBWAY = "subway", "Subway Station"
    BUS_STOP = "bus_stop", "Bus Stop"
    TRAIN = "train", "Train Hub"


SUBTYPE_TO_CATEGORY = {
    AmenitySubtype.SCHOOL: AmenityCategory.EDUCATION,
    AmenitySubtype.COLLEGE: AmenityCategory.EDUCATION,
    AmenitySubtype.DAYCARE: AmenityCategory.EDUCATION,
    AmenitySubtype.FIRE_STATION: AmenityCategory.SAFETY,
    AmenitySubtype.POLICE_STATION: AmenityCategory.SAFETY,
    AmenitySubtype.HOSPITAL: AmenityCategory.HEALTHCARE,
    AmenitySubtype.PHARMACY: AmenityCategory.HEALTHCARE,
    AmenitySubtype.URGENT_CARE: AmenityCategory.HEALTHCARE,
    AmenitySubtype.SUBWAY: AmenityCategory.MOBILITY,
    AmenitySubtype.BUS_STOP: AmenityCategory.MOBILITY,
    AmenitySubtype.TRAIN: AmenityCategory.MOBILITY,
}


class Property(models.Model):
    """A listed property. Coordinates are the single source of truth for
    every downstream geospatial lookup."""

    external_id = models.CharField(max_length=128, blank=True, db_index=True,
                                    help_text="ID from the source listing feed, if any.")
    title = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    location = gis_models.PointField(geography=True, srid=4326,
                                      help_text="WGS84 lon/lat of the property.")
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    listing_type = models.CharField(
        max_length=10,
        choices=[("sale", "For Sale"), ("rent", "For Rent")],
        default="sale",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["is_active", "listing_type"])]

    def __str__(self):
        return f"{self.title} ({self.address})"


class Amenity(models.Model):
    """A single point of interest discovered near one or more properties
    (school, hospital, transit stop, etc). Sourced from Overpass/Google."""

    source = models.CharField(max_length=32, default="overpass",
                               help_text="overpass | google_places")
    source_id = models.CharField(max_length=128, db_index=True,
                                  help_text="Provider's own ID, for dedupe.")
    name = models.CharField(max_length=255, blank=True)
    subtype = models.CharField(max_length=32, choices=AmenitySubtype.choices)
    category = models.CharField(max_length=32, choices=AmenityCategory.choices)
    location = gis_models.PointField(geography=True, srid=4326)
    raw_tags = models.JSONField(default=dict, blank=True)
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["category", "subtype"])]
        constraints = [
            models.UniqueConstraint(fields=["source", "source_id"], name="unique_amenity_source")
        ]

    def save(self, *args, **kwargs):
        if not self.category:
            self.category = SUBTYPE_TO_CATEGORY.get(self.subtype, AmenityCategory.EDUCATION)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_subtype_display()}: {self.name or self.source_id}"


class PropertyAmenityLink(models.Model):
    """Cached result of 'this amenity is X meters from this property,
    with an estimated travel time of Y seconds'. This is the row the
    scoring engine actually reads -- it avoids re-running spatial queries
    or routing calls on every score request."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="amenity_links")
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name="property_links")
    distance_meters = models.FloatField()
    estimated_travel_seconds = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Driving ETA if a routing lookup was done; else null (straight-line only).",
    )
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["property", "amenity"])]
        constraints = [
            models.UniqueConstraint(fields=["property", "amenity"], name="unique_property_amenity")
        ]


class TrafficSnapshot(models.Model):
    """Short-lived cache of live/typical traffic conditions around a
    property, pulled from TomTom or HERE."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="traffic_snapshots")
    provider = models.CharField(max_length=16, default="tomtom")
    congestion_index = models.FloatField(
        help_text="0.0 (free-flow) to 1.0 (gridlock), provider-normalized.")
    avg_commute_seconds_peak = models.PositiveIntegerField(
        null=True, blank=True, help_text="Avg commute time during peak hours, if available.")
    current_speed_kph = models.FloatField(null=True, blank=True)
    free_flow_speed_kph = models.FloatField(null=True, blank=True)
    captured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        get_latest_by = "captured_at"
        indexes = [models.Index(fields=["property", "captured_at"])]


class UserPreferenceProfile(models.Model):
    """A named set of category weights a user can apply when ranking
    properties. Weights are 1 (low) - 5 (critical); 0 means 'ignore'."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="preference_profiles")
    name = models.CharField(max_length=100, default="Default")

    weight_education = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])
    weight_safety = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])
    weight_healthcare = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])
    weight_mobility = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])
    weight_traffic = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])

    # Search radius controls how far the fetchers scan for each category.
    search_radius_meters = models.PositiveIntegerField(default=2000)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_profile_name_per_user")
        ]

    def as_weight_dict(self) -> dict:
        return {
            AmenityCategory.EDUCATION: self.weight_education,
            AmenityCategory.SAFETY: self.weight_safety,
            AmenityCategory.HEALTHCARE: self.weight_healthcare,
            AmenityCategory.MOBILITY: self.weight_mobility,
            AmenityCategory.TRAFFIC: self.weight_traffic,
        }

    def __str__(self):
        return f"{self.user}: {self.name}"


class MatchScore(models.Model):
    """Cached output of the scoring engine for a (property, profile) pair,
    including the per-category breakdown so the frontend can explain the
    final number rather than just showing a bare percentage."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="match_scores")
    profile = models.ForeignKey(UserPreferenceProfile, on_delete=models.CASCADE, related_name="match_scores")
    total_score = models.FloatField(help_text="0-100 final weighted match score.")
    category_breakdown = models.JSONField(
        default=dict,
        help_text="{'education': {'raw_score': .., 'weight': .., 'contribution': ..}, ...}")
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["property", "profile"], name="unique_score_per_profile")
        ]
        ordering = ["-total_score"]

    def __str__(self):
        return f"{self.property_id} x {self.profile_id} = {self.total_score:.1f}"


class EmailVerificationCode(models.Model):
    """Temporary storage for email verification codes (OTPs) used during
    registration or password reset flows."""

    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=12,
        choices=[("register", "Register Verification"), ("reset", "Password Reset")]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.purpose}): {self.code}"

