"""
core/base/serializer.py — BaseSerializer (DRF)
================================================
All serializers in Bricklytics should inherit from this.

Features:
  - Strips unknown fields by default (security)
  - Adds to_internal_value() logging
  - Convenience: validated_data_or_raise()
"""

import logging

from rest_framework import serializers

logger = logging.getLogger('bricklytics.api')


class BaseSerializer(serializers.Serializer):
    """
    Base DRF Serializer with enhanced validation logging.

    Usage:
        class PropertySerializer(BaseSerializer):
            title = serializers.CharField(max_length=200)
    """

    def validate(self, attrs: dict) -> dict:
        """Hook for cross-field validation. Override in subclasses."""
        return attrs

    def to_internal_value(self, data: dict) -> dict:
        """
        Override to add validation-entry logging.
        Removes unknown fields before validation.
        """
        # Strip fields not declared on this serializer (security)
        known_fields = set(self.fields.keys())
        filtered = {k: v for k, v in data.items() if k in known_fields}

        logger.debug(
            '%s.to_internal_value called with keys=%s',
            self.__class__.__name__,
            list(filtered.keys()),
        )
        return super().to_internal_value(filtered)

    def validated_data_or_raise(self) -> dict:
        """Run validation and return cleaned data or raise ValidationError."""
        if not self.is_valid():
            from core.exceptions.base import ValidationError
            raise ValidationError(
                message='Validation failed.',
                errors=self.errors,
            )
        return self.validated_data


class BaseModelSerializer(serializers.Serializer):
    """
    Thin base for MongoEngine-backed serializers.
    (DRF's ModelSerializer is ORM-only; this provides a parallel interface.)

    Sub-class and declare fields manually:
        class PropertyReadSerializer(BaseModelSerializer):
            id    = serializers.CharField(read_only=True)
            title = serializers.CharField()
    """

    id = serializers.CharField(read_only=True)

    def create(self, validated_data: dict):
        raise NotImplementedError('create() must be implemented in the subclass.')

    def update(self, instance, validated_data: dict):
        raise NotImplementedError('update() must be implemented in the subclass.')
