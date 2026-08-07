"""
common/tests/test_amenity_normalizer.py — Test Suite for Amenity Normalizer Layer
"""

import pytest
from common.amenity_normalizer import normalize_amenity_name, normalize_amenity_list


def test_gym_normalization():
    assert normalize_amenity_name('Fitness Center Gym') == 'Gym'
    assert normalize_amenity_name('Gymnasium') == 'Gym'
    assert normalize_amenity_name('Modern Gym') == 'Gym'
    assert normalize_amenity_name('Premium Gym') == 'Gym'
    assert normalize_amenity_name('Health Club') == 'Gym'


def test_swimming_pool_normalization():
    assert normalize_amenity_name('Swimming Pool') == 'Swimming Pool'
    assert normalize_amenity_name('Infinity Pool') == 'Swimming Pool'
    assert normalize_amenity_name('Indoor Pool') == 'Swimming Pool'
    assert normalize_amenity_name('Outdoor Pool') == 'Swimming Pool'
    assert normalize_amenity_name('Heated Outdoor Pool') == 'Swimming Pool'
    assert normalize_amenity_name('Kids Pool') == 'Swimming Pool'


def test_ev_charging_normalization():
    assert normalize_amenity_name('EV Charging') == 'EV Charging'
    assert normalize_amenity_name('EV Charging Station') == 'EV Charging'
    assert normalize_amenity_name('Electric Vehicle Charging') == 'EV Charging'


def test_children_play_area_normalization():
    assert normalize_amenity_name('Kids Play Area') == "Children's Play Area"
    assert normalize_amenity_name('Children Play Area') == "Children's Play Area"
    assert normalize_amenity_name('Play Zone') == "Children's Play Area"
    assert normalize_amenity_name('Kids Zone') == "Children's Play Area"


def test_jogging_track_normalization():
    assert normalize_amenity_name('Jogging Track') == 'Jogging Track'
    assert normalize_amenity_name('Running Track') == 'Jogging Track'
    assert normalize_amenity_name('Walking Track') == 'Jogging Track'


def test_community_hall_normalization():
    assert normalize_amenity_name('Community Hall') == 'Community Hall'
    assert normalize_amenity_name('Banquet Hall') == 'Community Hall'
    assert normalize_amenity_name('Club Hall') == 'Community Hall'
    assert normalize_amenity_name('Party Hall') == 'Community Hall'
    assert normalize_amenity_name('Multipurpose Hall') == 'Community Hall'


def test_sports_court_normalization():
    assert normalize_amenity_name('Multi-Sports Court') == 'Sports Court'
    assert normalize_amenity_name('Sports Court') == 'Sports Court'
    assert normalize_amenity_name('Basketball Court') == 'Sports Court'
    assert normalize_amenity_name('Tennis Court') == 'Sports Court'
    assert normalize_amenity_name('Badminton Court') == 'Sports Court'
    assert normalize_amenity_name('Squash Court') == 'Sports Court'


def test_elevator_normalization():
    assert normalize_amenity_name('Private Elevator') == 'Elevator'
    assert normalize_amenity_name('Lift') == 'Elevator'
    assert normalize_amenity_name('High-Speed Elevator') == 'Elevator'
    assert normalize_amenity_name('Passenger Lift') == 'Elevator'


def test_garden_normalization():
    assert normalize_amenity_name('Manicured Lawn') == 'Garden'
    assert normalize_amenity_name('Landscape Garden') == 'Garden'
    assert normalize_amenity_name('Garden') == 'Garden'
    assert normalize_amenity_name('Green Area') == 'Garden'
    assert normalize_amenity_name('Gazebo Garden') == 'Garden'


def test_deduplication_in_list():
    raw_list = [
        'Gymnasium',
        'Fitness Center Gym',
        'Modern Gym',
        'Infinity Pool',
        'Swimming Pool',
        'Kids Play Area',
        'Children Play Area',
        'Lift',
        'High-Speed Elevator',
    ]
    normalized = normalize_amenity_list(raw_list)
    assert set(normalized) == {'Gym', 'Swimming Pool', "Children's Play Area", 'Elevator'}
    assert len(normalized) == 4
