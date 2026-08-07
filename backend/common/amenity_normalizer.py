"""
common/amenity_normalizer.py — Centralized Amenity Normalization Layer
======================================================================
Converts raw dataset amenity names into standard, user-friendly categories.
"""

import re
from typing import Any, List, Set, Union


AMENITY_RULES = [
    # 1. Gym / Fitness
    ('Gym', re.compile(r'\bgym\b|fitness|health club|gymnasium', re.IGNORECASE)),
    
    # 2. Swimming Pool
    ('Swimming Pool', re.compile(r'\bpool\b|swimming', re.IGNORECASE)),

    # 3. EV Charging
    ('EV Charging', re.compile(r'\bev\b|electric vehicle|\bcharging\b', re.IGNORECASE)),

    # 4. Children's Play Area
    ("Children's Play Area", re.compile(r'play (area|zone)|kids (play|zone|area)|children', re.IGNORECASE)),

    # 5. Jogging Track
    ('Jogging Track', re.compile(r'jogging|running track|walking track', re.IGNORECASE)),

    # 6. Community Hall
    ('Community Hall', re.compile(r'community hall|banquet|club hall|party hall|multipurpose hall', re.IGNORECASE)),

    # 7. Sports Court
    ('Sports Court', re.compile(r'sports court|basketball|tennis|badminton|squash', re.IGNORECASE)),

    # 8. Elevator
    ('Elevator', re.compile(r'elevator|\blift\b|passenger lift', re.IGNORECASE)),

    # 9. Garden
    ('Garden', re.compile(r'garden|lawn|landscape|green area|gazebo', re.IGNORECASE)),

    # 10. Club House
    ('Club House', re.compile(r'clubhouse|club house|recreation club', re.IGNORECASE)),

    # 11. Parking
    ('Parking', re.compile(r'parking|covered parking|visitor parking|reserved parking', re.IGNORECASE)),

    # 12. Security
    ('Security', re.compile(r'security|gated community|security guard', re.IGNORECASE)),

    # 13. CCTV
    ('CCTV', re.compile(r'cctv|surveillance', re.IGNORECASE)),

    # 14. Power Backup
    ('Power Backup', re.compile(r'power backup|generator', re.IGNORECASE)),

    # 15. Wi-Fi
    ('Wi-Fi', re.compile(r'wi-?fi|internet', re.IGNORECASE)),

    # 16. Library
    ('Library', re.compile(r'library|reading room', re.IGNORECASE)),

    # 17. Indoor Games
    ('Indoor Games', re.compile(r'indoor games|table tennis|carrom|chess', re.IGNORECASE)),

    # 18. Outdoor Games
    ('Outdoor Games', re.compile(r'outdoor games|cricket', re.IGNORECASE)),

    # 19. Pet Area
    ('Pet Area', re.compile(r'pet (area|park)', re.IGNORECASE)),

    # 20. Senior Citizen Area
    ('Senior Citizen Area', re.compile(r'senior citizen', re.IGNORECASE)),

    # 21. Temple
    ('Temple', re.compile(r'temple|meditation hall|prayer room', re.IGNORECASE)),

    # 22. Yoga Deck
    ('Yoga Deck', re.compile(r'yoga', re.IGNORECASE)),

    # 23. Sky Deck
    ('Sky Deck', re.compile(r'sky deck|rooftop deck', re.IGNORECASE)),

    # 24. Terrace Garden
    ('Terrace Garden', re.compile(r'terrace garden|rooftop garden|terrace', re.IGNORECASE)),

    # 25. BBQ Area
    ('BBQ Area', re.compile(r'bbq|barbecue', re.IGNORECASE)),

    # 26. Business Center
    ('Business Center', re.compile(r'business center|co-working', re.IGNORECASE)),

    # 27. Conference Room
    ('Conference Room', re.compile(r'conference|meeting room', re.IGNORECASE)),

    # 28. Intercom
    ('Intercom', re.compile(r'intercom', re.IGNORECASE)),

    # 29. Fire Safety
    ('Fire Safety', re.compile(r'fire safety|fire fighting', re.IGNORECASE)),

    # 30. Solar Power
    ('Solar Power', re.compile(r'solar', re.IGNORECASE)),

    # 31. Rain Water Harvesting
    ('Rain Water Harvesting', re.compile(r'rain water|rainwater', re.IGNORECASE)),
]


def normalize_amenity_name(raw_input: Any) -> str:
    """
    Normalizes a raw amenity name string/dict into a standardized category.
    """
    if not raw_input:
        return ''
    if isinstance(raw_input, dict):
        raw_str = raw_input.get('name') or raw_input.get('label') or ''
    elif hasattr(raw_input, 'name'):
        raw_str = getattr(raw_input, 'name', '')
    else:
        raw_str = str(raw_input)

    trimmed = raw_str.strip()
    if not trimmed:
        return ''

    for standard_name, regex in AMENITY_RULES:
        if regex.search(trimmed):
            return standard_name

    # Fallback to Title Casing
    return ' '.join(word.capitalize() for word in trimmed.split())


def normalize_amenity_list(amenities_list: List[Any]) -> List[str]:
    """
    Normalizes a list of amenities into a deduplicated list of standardized category strings.
    """
    if not amenities_list or not isinstance(amenities_list, list):
        return []

    seen: Set[str] = set()
    result: List[str] = []

    for item in amenities_list:
        norm = normalize_amenity_name(item)
        if norm and norm not in seen:
            seen.add(norm)
            result.append(norm)

    return result
