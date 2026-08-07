"""
accounts/models/user.py — MongoEngine User Document
===================================================
"""

import mongoengine as me
from datetime import datetime, timezone
from django.contrib.auth.hashers import make_password, check_password
from core.base.document import BaseDocument


class User(BaseDocument):
    """
    Central User model supporting both Buyer and Seller roles.
    """
    first_name = me.StringField(required=True, max_length=100)
    last_name = me.StringField(required=True, max_length=100)
    email = me.StringField(required=True, unique=True, max_length=255)
    phone_number = me.StringField(required=True, max_length=20)
    password_hash = me.StringField(required=True)
    role = me.StringField(required=True, choices=['buyer', 'seller'])

    # Account status & Verification
    is_verified = me.BooleanField(default=False)
    is_active = me.BooleanField(default=True)
    
    # 6-Digit Email Verification
    verification_code = me.StringField(required=False, null=True)
    verification_code_expires_at = me.DateTimeField(required=False, null=True)
    failed_verification_attempts = me.IntField(default=0)

    # Password Reset OTP
    reset_code = me.StringField(required=False, null=True)
    reset_code_expires_at = me.DateTimeField(required=False, null=True)

    meta = {
        'collection': 'users',
        'indexes': [
            'email',
            'role',
            'is_verified',
            'is_active',
            'created_at',
        ]
    }

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def set_password(self, raw_password: str) -> None:
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password_hash)

    def to_dict(self) -> dict:
        data = super().to_dict()
        data.pop('password_hash', None)
        data.pop('verification_code', None)
        data.pop('reset_code', None)
        data['full_name'] = self.full_name
        return data
