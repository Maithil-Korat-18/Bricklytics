"""
buyer/models/property_view.py — Recently Viewed Properties Tracker
"""

import mongoengine as me
from datetime import datetime, timezone
from core.base.document import BaseDocument


class PropertyView(BaseDocument):
    user_id = me.StringField(required=True)
    property_id = me.StringField(required=True)
    viewed_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'property_views',
        'indexes': [
            'user_id',
            'property_id',
            'viewed_at',
        ]
    }
