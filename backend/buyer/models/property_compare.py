"""
buyer/models/property_compare.py — Compare Property Model
"""

import mongoengine as me
from core.base.document import BaseDocument


class PropertyCompare(BaseDocument):
    user_id = me.StringField(required=True)
    property_id = me.StringField(required=True)

    meta = {
        'collection': 'property_compares',
        'indexes': [
            'user_id',
            'property_id',
            ('user_id', 'property_id'),
        ]
    }
