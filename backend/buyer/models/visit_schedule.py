"""
buyer/models/visit_schedule.py — Property Visit Scheduling & Inquiry Conversation Model
"""

import mongoengine as me
from datetime import datetime
from core.base.document import BaseDocument


class InquiryMessage(me.EmbeddedDocument):
    id = me.StringField(required=True)
    sender_id = me.StringField(required=True)
    sender_role = me.StringField(required=True, choices=['buyer', 'seller'])
    sender_name = me.StringField(required=True)
    message = me.StringField(required=True)
    created_at = me.DateTimeField(default=datetime.utcnow)


class VisitSchedule(BaseDocument):
    user_id = me.StringField(required=True)
    seller_id = me.StringField(required=False, null=True)
    property_id = me.StringField(required=True)
    property_title = me.StringField(required=True)
    request_type = me.StringField(default='visit', choices=['visit', 'inquiry'])
    
    buyer_name = me.StringField(required=True)
    buyer_phone = me.StringField(required=True)
    buyer_email = me.StringField(required=True)
    
    preferred_date = me.StringField(required=True)
    preferred_time = me.StringField(required=True)
    
    suggested_date = me.StringField(required=False, null=True)
    suggested_time = me.StringField(required=False, null=True)
    
    notes = me.StringField(required=False, null=True, default='')
    seller_reply = me.StringField(required=False, null=True)
    replied_at = me.DateTimeField(required=False, null=True)
    
    messages = me.EmbeddedDocumentListField(InquiryMessage, default=list)
    
    status = me.StringField(
        default='requested',
        choices=['requested', 'confirmed', 'rejected', 'rescheduled', 'completed', 'cancelled']
    )

    meta = {
        'collection': 'visit_schedules',
        'indexes': [
            'user_id',
            'seller_id',
            'property_id',
            'status',
            'request_type',
            'created_at',
        ]
    }
