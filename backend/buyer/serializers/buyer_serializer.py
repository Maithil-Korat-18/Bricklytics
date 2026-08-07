"""
buyer/serializers/buyer_serializer.py — DRF Serializers for Buyer Module
"""

from rest_framework import serializers
from core.base.serializer import BaseSerializer, BaseModelSerializer
from seller.serializers.property_serializer import PropertyResponseSerializer


class WishlistCreateSerializer(BaseSerializer):
    property_id = serializers.CharField()


class WishlistCreateSerializer(BaseSerializer):
    property_id = serializers.CharField()


class VisitScheduleCreateSerializer(BaseSerializer):
    property_id = serializers.CharField()
    preferred_date = serializers.CharField()
    preferred_time = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class VisitScheduleResponseSerializer(BaseModelSerializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    property_id = serializers.CharField()
    property_title = serializers.CharField()
    buyer_name = serializers.CharField()
    buyer_phone = serializers.CharField()
    buyer_email = serializers.CharField()
    preferred_date = serializers.CharField()
    preferred_time = serializers.CharField()
    notes = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    created_at = serializers.CharField()


class WishlistResponseSerializer(BaseModelSerializer):
    id = serializers.CharField(read_only=True)
    property_id = serializers.CharField()
    property_details = PropertyResponseSerializer(required=False, allow_null=True)
    created_at = serializers.CharField()

