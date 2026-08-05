"""
accounts/serializers/auth_serializer.py — Serializers for Auth Operations
"""

from rest_framework import serializers
from core.base.serializer import BaseSerializer, BaseModelSerializer


import re

def validate_password_strength(value):
    if len(value) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError("Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r'[a-z]', value):
        raise serializers.ValidationError("Password must contain at least one lowercase letter (a-z).")
    if not re.search(r'[0-9]', value):
        raise serializers.ValidationError("Password must contain at least one number (0-9).")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
        raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*...).")
    return value


class SignupSerializer(BaseSerializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['buyer', 'seller'])

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        return validate_password_strength(value)


class LoginSerializer(BaseSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required.")
        return value


class VerifyEmailSerializer(BaseSerializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate_email(self, value):
        return value.strip().lower()


class ResendCodeSerializer(BaseSerializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ForgotPasswordSerializer(BaseSerializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ResetPasswordSerializer(BaseSerializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_new_password(self, value):
        return validate_password_strength(value)



class UserResponseSerializer(BaseModelSerializer):
    id = serializers.CharField(read_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    role = serializers.CharField()
    is_verified = serializers.BooleanField()
    is_active = serializers.BooleanField()
    created_at = serializers.CharField()
