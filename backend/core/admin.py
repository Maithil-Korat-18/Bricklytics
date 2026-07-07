from django.contrib import admin

from core.models import (
    Amenity,
    MatchScore,
    Property,
    PropertyAmenityLink,
    TrafficSnapshot,
    UserPreferenceProfile,
)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "address", "price", "listing_type", "is_active")
    search_fields = ("title", "address", "external_id")
    list_filter = ("listing_type", "is_active")


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ("name", "subtype", "category", "source")
    list_filter = ("category", "subtype", "source")
    search_fields = ("name",)


@admin.register(PropertyAmenityLink)
class PropertyAmenityLinkAdmin(admin.ModelAdmin):
    list_display = ("property", "amenity", "distance_meters", "computed_at")
    list_filter = ("amenity__category",)


@admin.register(TrafficSnapshot)
class TrafficSnapshotAdmin(admin.ModelAdmin):
    list_display = ("property", "provider", "congestion_index", "captured_at")


@admin.register(UserPreferenceProfile)
class UserPreferenceProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "weight_education", "weight_safety",
                     "weight_healthcare", "weight_mobility", "weight_traffic")


@admin.register(MatchScore)
class MatchScoreAdmin(admin.ModelAdmin):
    list_display = ("property", "profile", "total_score", "computed_at")
    ordering = ("-total_score",)
