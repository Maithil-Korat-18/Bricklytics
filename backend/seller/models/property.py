"""
seller/models/property.py — MongoEngine Models for Ahmedabad Seller Module
"""

import mongoengine as me
from seller.models.base import SellerBaseDocument


class PropertyAmenity(me.EmbeddedDocument):
    name = me.StringField(required=True)
    category = me.StringField(default='General')
    icon = me.StringField(required=False, null=True)


class PropertyImage(me.EmbeddedDocument):
    id = me.StringField(required=True)
    url = me.StringField(required=True)
    file_path = me.StringField(required=True)
    is_cover = me.BooleanField(default=False)
    caption = me.StringField(required=False, null=True)
    created_at = me.DateTimeField()


class PropertyDocument(me.EmbeddedDocument):
    id = me.StringField(required=True)
    title = me.StringField(required=True)
    url = me.StringField(required=True)
    file_path = me.StringField(required=True)
    file_type = me.StringField(default='pdf')
    created_at = me.DateTimeField()


class PredictionHistory(me.EmbeddedDocument):
    prediction_id = me.StringField(required=True)
    predicted_price = me.FloatField(required=True)
    confidence_score = me.FloatField(required=False, null=True)
    features_used = me.DictField()
    predicted_at = me.DateTimeField()


class Property(SellerBaseDocument):
    title = me.StringField(required=True, max_length=200)
    description = me.StringField(required=False, null=True)
    property_type = me.StringField(
        required=True,
        choices=['apartment', 'villa', 'house', 'plot', 'commercial', 'studio']
    )
    listing_type = me.StringField(
        required=True,
        choices=['sell'],
        default='sell'
    )
    sale_type = me.StringField(
        required=True,
        choices=['new', 'resale'],
        default='new'
    )
    reconstruction_needed = me.StringField(
        required=False,
        null=True,
        choices=['Never Renovated', 'Minor Renovation', 'Major Renovation', 'Fully Reconstructed', 'Newly Renovated', '']
    )
    price = me.FloatField(required=True, min_value=0.0)
    rate_per_sqft = me.FloatField(required=False, default=4000.0)
    bhk = me.IntField(default=2, min_value=1)
    bedrooms = me.IntField(default=2, min_value=0)
    bathrooms = me.IntField(default=2, min_value=0)
    balconies = me.IntField(default=1, min_value=0)
    area_sqft = me.FloatField(required=True, min_value=1.0)
    built_up_area = me.FloatField(required=False, null=True)
    super_built_up_area = me.FloatField(required=False, null=True)
    floor_number = me.IntField(default=1)
    total_floors = me.IntField(default=5)
    property_age = me.IntField(default=1)
    year_built = me.IntField(required=False, null=True)
    facing = me.StringField(default='East')
    furnishing = me.StringField(default='Semi-Furnished')
    parking = me.StringField(default='Yes')

    # Location details — Standardized for Ahmedabad City
    address = me.StringField(required=True)
    locality = me.StringField(required=False, default='South Bopal')
    city = me.StringField(required=True, default='Ahmedabad')
    state = me.StringField(required=True, default='Gujarat')
    pincode = me.StringField(required=True, default='380001')
    latitude = me.FloatField(required=False, default=23.0225)
    longitude = me.FloatField(required=False, default=72.5714)

    # Pricing & Financial Details
    maintenance_charges = me.FloatField(default=0.0)
    booking_amount = me.FloatField(default=0.0)
    negotiable = me.BooleanField(default=True)

    # Builder & Legal Details
    builder_name = me.StringField(required=False, null=True)
    project_name = me.StringField(required=False, null=True)
    rera_number = me.StringField(required=False, null=True)
    possession_status = me.StringField(default='Ready')
    possession_date = me.StringField(required=False, null=True)

    # Seller Contact Details
    seller_name = me.StringField(required=False, null=True)
    phone_number = me.StringField(required=False, null=True)
    email = me.StringField(required=False, null=True)

    # Embedded Documents & Arrays
    amenities = me.EmbeddedDocumentListField(PropertyAmenity)
    images = me.EmbeddedDocumentListField(PropertyImage)
    brochures = me.EmbeddedDocumentListField(PropertyDocument)
    predictions = me.EmbeddedDocumentListField(PredictionHistory)

    meta = {
        'collection': 'properties',
        'indexes': [
            'title',
            'city',
            'locality',
            'property_type',
            'listing_type',
            'price',
            'status',
            'is_deleted',
            'created_at',
            ('city', 'locality', 'property_type'),
        ]
    }
