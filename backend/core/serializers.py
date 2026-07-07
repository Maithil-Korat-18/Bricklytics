from rest_framework import serializers

from core.models import (
    Amenity,
    MatchScore,
    Property,
    PropertyAmenityLink,
    TrafficSnapshot,
    UserPreferenceProfile,
)

# Geometry fields are exposed as plain longitude/latitude floats below
# rather than full GeoJSON, to keep the API dependency-light. If you want
# GeoJSON geometries instead, add djangorestframework-gis and swap
# ModelSerializer for GeoFeatureModelSerializer.


class PropertySerializer(serializers.ModelSerializer):
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id", "external_id", "title", "address", "longitude", "latitude",
            "price", "bedrooms", "bathrooms", "listing_type", "is_active",
            "created_at", "updated_at",
        ]

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None


class AmenitySerializer(serializers.ModelSerializer):
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()

    class Meta:
        model = Amenity
        fields = ["id", "name", "subtype", "category", "longitude", "latitude", "source"]

    def get_longitude(self, obj):
        return obj.location.x

    def get_latitude(self, obj):
        return obj.location.y


class PropertyAmenityLinkSerializer(serializers.ModelSerializer):
    amenity = AmenitySerializer(read_only=True)

    class Meta:
        model = PropertyAmenityLink
        fields = ["amenity", "distance_meters", "estimated_travel_seconds", "computed_at"]


class TrafficSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrafficSnapshot
        fields = [
            "provider", "congestion_index", "avg_commute_seconds_peak",
            "current_speed_kph", "free_flow_speed_kph", "captured_at",
        ]


class UserPreferenceProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferenceProfile
        fields = [
            "id", "name", "weight_education", "weight_safety",
            "weight_healthcare", "weight_mobility", "weight_traffic",
            "search_radius_meters", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class MatchScoreSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = MatchScore
        fields = ["property", "total_score", "category_breakdown", "computed_at"]
