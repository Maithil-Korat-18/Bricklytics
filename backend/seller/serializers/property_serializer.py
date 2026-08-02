"""
seller/serializers/property_serializer.py — Serializers for Ahmedabad Property module
"""

from rest_framework import serializers
from core.base.serializer import BaseSerializer, BaseModelSerializer


class PropertyAmenitySerializer(BaseSerializer):
    name = serializers.CharField(max_length=100)
    category = serializers.CharField(max_length=50, default='General', required=False)
    icon = serializers.CharField(max_length=100, required=False, allow_null=True)


class PropertyImageSerializer(BaseSerializer):
    id = serializers.CharField(read_only=True)
    url = serializers.CharField(read_only=True)
    is_cover = serializers.BooleanField(read_only=True)
    caption = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.CharField(read_only=True)


class PropertyDocumentSerializer(BaseSerializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    url = serializers.CharField(read_only=True)
    file_type = serializers.CharField(read_only=True)
    created_at = serializers.CharField(read_only=True)


class PropertyCreateUpdateSerializer(BaseSerializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    property_type = serializers.ChoiceField(
        choices=['apartment', 'villa', 'house', 'plot', 'commercial', 'studio']
    )
    listing_type = serializers.CharField(default='sell', required=False)
    sale_type = serializers.ChoiceField(
        choices=['new', 'resale'],
        default='new',
        required=False
    )
    reconstruction_needed = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    price = serializers.FloatField(min_value=0.0)
    rate_per_sqft = serializers.FloatField(required=False, default=4000.0)
    bhk = serializers.IntegerField(default=2, min_value=1)
    bedrooms = serializers.IntegerField(min_value=0, default=2)
    bathrooms = serializers.IntegerField(min_value=0, default=2)
    balconies = serializers.IntegerField(min_value=0, default=1)
    area_sqft = serializers.FloatField(min_value=1.0)
    built_up_area = serializers.FloatField(required=False, allow_null=True)
    super_built_up_area = serializers.FloatField(required=False, allow_null=True)
    floor_number = serializers.IntegerField(required=False, default=1)
    total_floors = serializers.IntegerField(required=False, default=5)
    property_age = serializers.IntegerField(required=False, default=1)
    year_built = serializers.IntegerField(required=False, allow_null=True)
    facing = serializers.CharField(required=False, default='East')
    furnishing = serializers.CharField(required=False, default='Semi-Furnished')
    parking = serializers.CharField(required=False, default='Yes')

    address = serializers.CharField(max_length=500)
    locality = serializers.CharField(max_length=200, required=False, default='South Bopal')
    city = serializers.CharField(max_length=100, default='Ahmedabad')
    state = serializers.CharField(max_length=100, default='Gujarat')
    pincode = serializers.CharField(max_length=20, default='380001')
    latitude = serializers.FloatField(required=False, default=23.0225)
    longitude = serializers.FloatField(required=False, default=72.5714)

    maintenance_charges = serializers.FloatField(required=False, default=0.0)
    booking_amount = serializers.FloatField(required=False, default=0.0)
    negotiable = serializers.BooleanField(required=False, default=True)

    builder_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    project_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    rera_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    possession_status = serializers.CharField(required=False, default='Ready')
    possession_date = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    seller_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    email = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status = serializers.ChoiceField(
        choices=['draft', 'active', 'inactive', 'sold', 'archived'],
        required=False,
        default='active',
    )

    amenities = PropertyAmenitySerializer(many=True, required=False, default=[])


class PropertyResponseSerializer(BaseModelSerializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    property_type = serializers.CharField()
    listing_type = serializers.CharField()
    sale_type = serializers.CharField(allow_null=True, required=False)
    reconstruction_needed = serializers.CharField(allow_null=True, required=False)
    price = serializers.FloatField()
    rate_per_sqft = serializers.FloatField(allow_null=True)
    bhk = serializers.IntegerField(allow_null=True)
    bedrooms = serializers.IntegerField()
    bathrooms = serializers.IntegerField()
    balconies = serializers.IntegerField(allow_null=True)
    area_sqft = serializers.FloatField()
    built_up_area = serializers.FloatField(allow_null=True)
    super_built_up_area = serializers.FloatField(allow_null=True)
    floor_number = serializers.IntegerField(allow_null=True)
    total_floors = serializers.IntegerField(allow_null=True)
    property_age = serializers.IntegerField(allow_null=True)
    year_built = serializers.IntegerField(allow_null=True)
    facing = serializers.CharField(allow_null=True)
    furnishing = serializers.CharField(allow_null=True)
    parking = serializers.CharField(allow_null=True)

    address = serializers.CharField()
    locality = serializers.CharField(allow_null=True)
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)

    maintenance_charges = serializers.FloatField(allow_null=True)
    booking_amount = serializers.FloatField(allow_null=True)
    negotiable = serializers.BooleanField(allow_null=True)

    builder_name = serializers.CharField(allow_null=True)
    project_name = serializers.CharField(allow_null=True)
    rera_number = serializers.CharField(allow_null=True)
    possession_status = serializers.CharField(allow_null=True)
    possession_date = serializers.CharField(allow_null=True)

    seller_name = serializers.CharField(allow_null=True)
    phone_number = serializers.CharField(allow_null=True)
    email = serializers.CharField(allow_null=True)

    amenities = PropertyAmenitySerializer(many=True)
    images = PropertyImageSerializer(many=True)
    brochures = PropertyDocumentSerializer(many=True)
    status = serializers.CharField()
    created_at = serializers.CharField()
    updated_at = serializers.CharField()


class PropertyStatusUpdateSerializer(BaseSerializer):
    status = serializers.ChoiceField(choices=['draft', 'active', 'inactive', 'sold', 'archived'])
