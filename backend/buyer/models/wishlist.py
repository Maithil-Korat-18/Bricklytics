"""
buyer/models/wishlist.py — Wishlist Model
"""

import mongoengine as me
from core.base.document import BaseDocument


class Wishlist(BaseDocument):
    user_id = me.StringField(required=True)
    property_id = me.StringField(required=True)

    meta = {
        'collection': 'wishlists',
        'indexes': [
            'user_id',
            'property_id',
            ('user_id', 'property_id'),
        ]
    }
