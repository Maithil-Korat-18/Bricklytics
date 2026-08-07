"""
common/utils.py — General Purpose Utilities
============================================
Stateless helpers shared across all Bricklytics apps.
"""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any


# ── ID Helpers ────────────────────────────────────────────────────────────────

def generate_uuid() -> str:
    """Generate a unique UUID4 string."""
    return str(uuid.uuid4())


def generate_short_id(prefix: str = '') -> str:
    """Generate a short unique ID like 'PROP-3f2a1b'."""
    uid = uuid.uuid4().hex[:8].upper()
    return f'{prefix}-{uid}' if prefix else uid


# ── Datetime ──────────────────────────────────────────────────────────────────

def utc_now() -> datetime:
    """Return current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def to_iso_string(dt: datetime | None) -> str | None:
    """Convert datetime to ISO 8601 string."""
    if dt is None:
        return None
    return dt.isoformat()


# ── Dict Helpers ──────────────────────────────────────────────────────────────

def remove_none_values(data: dict) -> dict:
    """Remove keys with None values from a dict."""
    return {k: v for k, v in data.items() if v is not None}


def flatten_dict(data: dict, parent_key: str = '', sep: str = '.') -> dict:
    """Flatten a nested dict: {'a': {'b': 1}} → {'a.b': 1}."""
    items: dict = {}
    for k, v in data.items():
        new_key = f'{parent_key}{sep}{k}' if parent_key else k
        if isinstance(v, dict):
            items.update(flatten_dict(v, new_key, sep))
        else:
            items[new_key] = v
    return items


def pick(data: dict, keys: list[str]) -> dict:
    """Return a sub-dict containing only specified keys."""
    return {k: data[k] for k in keys if k in data}


def omit(data: dict, keys: list[str]) -> dict:
    """Return a sub-dict excluding specified keys."""
    return {k: v for k, v in data.items() if k not in keys}


# ── String Helpers ────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Convert text to a URL-safe slug: 'Hello World' → 'hello-world'."""
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return re.sub(r'-+', '-', text).strip('-')


def truncate(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """Truncate a string to max_length, appending suffix if truncated."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


# ── Hashing ───────────────────────────────────────────────────────────────────

def md5_hash(data: str) -> str:
    return hashlib.md5(data.encode('utf-8')).hexdigest()


def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


# ── Property Helpers ──────────────────────────────────────────────────────────

def normalize_property_type(value: str) -> str:
    """Standardize raw property type inputs into 'Apartment' or 'Villa'."""
    val = str(value or '').strip().lower()
    if any(k in val for k in ['villa', 'house', 'bungalow', 'row house', 'duplex']):
        return 'Villa'
    return 'Apartment'

