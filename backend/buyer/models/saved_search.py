"""
buyer/models/saved_search.py — Saved Searches Model
"""

import mongoengine as me
from core.base.document import BaseDocument


class SavedSearch(BaseDocument):
    user_id = me.StringField(required=True)
    title = me.StringField(required=True, max_length=200)
    filters = me.DictField(required=True)

    meta = {
        'collection': 'saved_searches',
        'indexes': [
            'user_id',
            'created_at',
        ]
    }
