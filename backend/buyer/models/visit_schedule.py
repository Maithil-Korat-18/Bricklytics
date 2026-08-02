"""
buyer/models/visit_schedule.py — Property Visit Scheduling Model
"""

import mongoengine as me
from core.base.document import BaseDocument


class VisitSchedule(BaseDocument):
    user_id = me.StringField(required=True)
    property_id = me.StringField(required=True)
    property_title = me.StringField(required=True)
    buyer_name = me.StringField(required=True)
    buyer_phone = me.StringField(required=True)
    buyer_email = me.StringField(required=True)
    preferred_date = me.StringField(required=True)
    preferred_time = me.StringField(required=True)
    notes = me.StringField(required=False, null=True, default='')
    status = me.StringField(
        default='requested',
        choices=['requested', 'confirmed', 'completed', 'cancelled']
    )

    meta = {
        'collection': 'visit_schedules',
        'indexes': [
            'user_id',
            'property_id',
            'status',
            'created_at',
        ]
    }
