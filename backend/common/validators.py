"""
common/validators.py — Shared Validation Helpers
=================================================
Pure functions; no Django/DRF dependencies.
Use from any layer: serializer, service, validator class.
"""

import re
from typing import Any


# ── String ────────────────────────────────────────────────────────────────────

def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def is_valid_length(value: str, min_len: int = 0, max_len: int = 255) -> bool:
    return min_len <= len(value.strip()) <= max_len


# ── Numbers ───────────────────────────────────────────────────────────────────

def is_positive_number(value: Any) -> bool:
    try:
        return float(value) > 0
    except (TypeError, ValueError):
        return False


def is_non_negative_number(value: Any) -> bool:
    try:
        return float(value) >= 0
    except (TypeError, ValueError):
        return False


def is_in_range(value: Any, min_val: float, max_val: float) -> bool:
    try:
        return min_val <= float(value) <= max_val
    except (TypeError, ValueError):
        return False


# ── Contact ───────────────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
_PHONE_RE = re.compile(r'^\+?[0-9\s\-().]{7,20}$')


def is_valid_email(value: str) -> bool:
    return bool(_EMAIL_RE.match(value or ''))


def is_valid_phone(value: str) -> bool:
    return bool(_PHONE_RE.match(value or ''))


# ── Geography ─────────────────────────────────────────────────────────────────

def is_valid_latitude(value: Any) -> bool:
    return is_in_range(value, -90.0, 90.0)


def is_valid_longitude(value: Any) -> bool:
    return is_in_range(value, -180.0, 180.0)


def is_valid_coordinates(lat: Any, lng: Any) -> bool:
    return is_valid_latitude(lat) and is_valid_longitude(lng)


# ── Real Estate ───────────────────────────────────────────────────────────────

def is_valid_price(value: Any) -> bool:
    """Price must be a positive number up to 10 billion."""
    return is_in_range(value, 0.01, 10_000_000_000)


def is_valid_area(value: Any) -> bool:
    """Area in sq ft — must be between 1 and 10,000,000."""
    return is_in_range(value, 1, 10_000_000)


def is_valid_year_built(value: Any) -> bool:
    from datetime import date
    try:
        year = int(value)
        return 1800 <= year <= date.today().year
    except (TypeError, ValueError):
        return False


# ── Mongo ObjectId ────────────────────────────────────────────────────────────

_OBJECT_ID_RE = re.compile(r'^[a-f0-9]{24}$')


def is_valid_object_id(value: str) -> bool:
    return bool(_OBJECT_ID_RE.match(str(value or '')))
