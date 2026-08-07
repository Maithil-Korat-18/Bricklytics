"""
seller/validators/base.py — Seller Input Validators
=====================================================
Validation lives at the SERIALIZER boundary (Step 1).
Complex cross-field or business-rule validation lives here (Step 2).

Validation strategy for Bricklytics:
  ┌──────────────────────────────────────────────────────────┐
  │  Layer       │  What to validate                         │
  ├──────────────────────────────────────────────────────────┤
  │  Serializer  │  Field types, required fields, max_length │
  │  Validator   │  Cross-field rules, format checks         │
  │  Service     │  Business rules (e.g. price > market min) │
  │  Repository  │  DB-level constraints (duplicates, refs)  │
  └──────────────────────────────────────────────────────────┘
"""

from common.validators import (
    is_valid_price,
    is_valid_area,
    is_valid_coordinates,
    is_valid_year_built,
    is_non_empty_string,
)
from core.exceptions.base import ValidationError


class PropertyValidator:
    """
    Cross-field / business-rule validation for property data.
    Called by PropertyService before delegating to the repository.

    Usage:
        validator = PropertyValidator(data)
        validator.validate()   # raises ValidationError on failure
    """

    def __init__(self, data: dict) -> None:
        self.data   = data
        self.errors: dict = {}

    def validate(self) -> None:
        """Run all validation rules. Raise ValidationError if any fail."""
        self._validate_title()
        self._validate_sale_type()
        self._validate_price()
        self._validate_area()
        self._validate_location()

        if self.errors:
            raise ValidationError(
                message='Property validation failed.',
                errors=self.errors,
            )

    def _validate_sale_type(self) -> None:
        sale_type = self.data.get('sale_type')
        if sale_type:
            sale_type_str = str(sale_type).lower()
            if sale_type_str not in ['new', 'resale']:
                self.errors['sale_type'] = 'Sale type must be either "new" or "resale".'
            elif sale_type_str == 'resale':
                reconstruction = self.data.get('reconstruction_needed')
                if reconstruction is None or str(reconstruction).strip() == '':
                    self.errors['reconstruction_needed'] = 'Please specify whether reconstruction is needed for resale property.'

    # ── Individual Rules ──────────────────────────────────────────────────────

    def _validate_title(self) -> None:
        title = self.data.get('title', '')
        if not is_non_empty_string(title):
            self.errors['title'] = 'Title is required and must be a non-empty string.'
        elif len(title.strip()) < 3:
            self.errors['title'] = 'Title must be at least 3 characters.'
        elif len(title.strip()) > 200:
            self.errors['title'] = 'Title must not exceed 200 characters.'

    def _validate_price(self) -> None:
        price = self.data.get('price')
        if price is not None and not is_valid_price(price):
            self.errors['price'] = 'Price must be a positive number up to 10 billion.'

    def _validate_area(self) -> None:
        area = self.data.get('area_sqft') or self.data.get('area')
        if area is not None and not is_valid_area(area):
            self.errors['area_sqft'] = 'Area must be between 1 and 10,000,000 sq ft.'

    def _validate_location(self) -> None:
        lat = self.data.get('latitude')
        lng = self.data.get('longitude')
        if lat is not None or lng is not None:
            if not is_valid_coordinates(lat, lng):
                self.errors['location'] = (
                    'Invalid coordinates. Latitude must be -90 to 90, '
                    'longitude must be -180 to 180.'
                )
