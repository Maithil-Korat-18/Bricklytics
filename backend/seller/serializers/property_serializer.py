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
        choices=['apartment', 'flat', 'villa', 'house', 'plot', 'commercial', 'studio']
    )
    listing_type = serializers.ChoiceField(
        choices=['sell'],
        default='sell',
        required=False,
    )
    sale_type = serializers.ChoiceField(
        choices=['new', 'resale'],
        default='new',
        required=False
    )
    reconstruction_needed = serializers.ChoiceField(
        choices=['Never Renovated', 'Minor Renovation', 'Major Renovation', 'Fully Reconstructed', 'Newly Renovated', ''],
        required=False,
        allow_null=True,
        allow_blank=True,
    )
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
    latitude = serializers.FloatField(required=False, allow_null=True, default=None)
    longitude = serializers.FloatField(required=False, allow_null=True, default=None)


    maintenance_charges = serializers.FloatField(required=False, default=0.0)
    booking_amount = serializers.FloatField(required=False, default=0.0)
    negotiable = serializers.BooleanField(required=False, default=True)

    units_per_floor = serializers.IntegerField(required=False, default=0)
    total_units = serializers.IntegerField(required=False, default=0)
    units_sold = serializers.IntegerField(required=False, default=0)
    sample_house_ready = serializers.BooleanField(required=False, default=False)
    layout_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    nearby_places = serializers.ListField(child=serializers.CharField(), required=False, default=[])

    builder_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    project_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    rera_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    possession_status = serializers.ChoiceField(
        choices=['Ready', 'Ready to Move', 'Under Construction', 'New Launch'],
        required=False,
        default='Ready',
    )
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

    # AI Predictions & Investment Scores
    predicted_price = serializers.FloatField(required=False, allow_null=True)
    confidence_score = serializers.FloatField(required=False, allow_null=True)
    appreciation_annual_rate = serializers.FloatField(required=False, allow_null=True)
    appreciation_1yr = serializers.FloatField(required=False, allow_null=True)
    appreciation_3yr = serializers.FloatField(required=False, allow_null=True)
    appreciation_5yr = serializers.FloatField(required=False, allow_null=True)
    future_price_1yr = serializers.FloatField(required=False, allow_null=True)
    future_price_3yr = serializers.FloatField(required=False, allow_null=True)
    future_price_5yr = serializers.FloatField(required=False, allow_null=True)
    investment_score = serializers.IntegerField(required=False, allow_null=True)
    investment_rating = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    investment_explanation = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    investment_reasons = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    prediction_fingerprint = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    base_ml_price = serializers.FloatField(required=False, allow_null=True)
    amenity_adjustment = serializers.FloatField(required=False, allow_null=True)
    appreciation_methodology = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    prediction_timestamp = serializers.DateTimeField(required=False, allow_null=True)


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

    units_per_floor = serializers.IntegerField(allow_null=True, required=False)
    total_units = serializers.IntegerField(allow_null=True, required=False)
    units_sold = serializers.IntegerField(allow_null=True, required=False)
    units_available = serializers.SerializerMethodField()
    sample_house_ready = serializers.BooleanField(allow_null=True, required=False)
    layout_type = serializers.CharField(allow_null=True, required=False)
    nearby_places = serializers.ListField(child=serializers.CharField(), required=False, default=[])

    def get_units_available(self, obj):
        tot = getattr(obj, 'total_units', 0) or 0
        sld = getattr(obj, 'units_sold', 0) or 0
        if isinstance(obj, dict):
            tot = obj.get('total_units', 0) or 0
            sld = obj.get('units_sold', 0) or 0
        return max(0, tot - sld)

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

    # AI & Investment Stored Predictions
    predicted_price = serializers.FloatField(required=False, allow_null=True)
    confidence_score = serializers.FloatField(required=False, allow_null=True)
    appreciation_annual_rate = serializers.FloatField(required=False, allow_null=True)
    appreciation_1yr = serializers.FloatField(required=False, allow_null=True)
    appreciation_3yr = serializers.FloatField(required=False, allow_null=True)
    appreciation_5yr = serializers.FloatField(required=False, allow_null=True)
    future_price_1yr = serializers.FloatField(required=False, allow_null=True)
    future_price_3yr = serializers.FloatField(required=False, allow_null=True)
    future_price_5yr = serializers.FloatField(required=False, allow_null=True)
    investment_score = serializers.IntegerField(required=False, allow_null=True)
    investment_rating = serializers.CharField(required=False, allow_null=True)
    investment_explanation = serializers.CharField(required=False, allow_null=True)
    investment_reasons = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    prediction_fingerprint = serializers.CharField(required=False, allow_null=True)
    base_ml_price = serializers.FloatField(required=False, allow_null=True)
    amenity_adjustment = serializers.FloatField(required=False, allow_null=True)
    appreciation_methodology = serializers.CharField(required=False, allow_null=True)
    prediction_timestamp = serializers.CharField(required=False, allow_null=True)

    # Legacy/Enriched fields
    investment_tag = serializers.CharField(required=False, read_only=True, allow_null=True)
    investment_tag_icon = serializers.CharField(required=False, read_only=True, allow_null=True)
    appreciation_rate = serializers.CharField(required=False, read_only=True, allow_null=True)
    ai_fair_price = serializers.FloatField(required=False, read_only=True, allow_null=True)
    score_breakdown = serializers.JSONField(required=False, read_only=True, allow_null=True)



class PropertyStatusUpdateSerializer(BaseSerializer):
    status = serializers.ChoiceField(choices=['draft', 'active', 'inactive', 'sold', 'archived'])
