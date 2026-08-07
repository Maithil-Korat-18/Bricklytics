"""
buyer/tests/test_compare_module.py — Test Suite for Property Compare Module
"""

import pytest
from rest_framework.test import APIClient
from accounts.models import User
from seller.models.property import Property
from buyer.models.property_compare import PropertyCompare
from buyer.services.buyer_service import BuyerService
from buyer.repositories.buyer_repository import PropertyCompareRepository


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def sample_buyer():
    user = User(
        email='buyer_compare_test@example.com',
        first_name='Test',
        last_name='Buyer',
        phone_number='9876543210',
        password_hash='hashed_pass',
        role='buyer',
        is_verified=True,
    )
    user.save()
    yield user
    user.delete()


@pytest.fixture
def sample_buyer_2():
    user = User(
        email='buyer_compare_test2@example.com',
        first_name='Second',
        last_name='Buyer',
        phone_number='9876543211',
        password_hash='hashed_pass',
        role='buyer',
        is_verified=True,
    )
    user.save()
    yield user
    user.delete()


@pytest.fixture
def sample_properties():
    props = []
    for i in range(15):
        p = Property(
            title=f'Compare Test Property {i+1}',
            property_type='apartment',
            price=5000000 + (i * 500000),
            area_sqft=1000 + (i * 100),
            bhk=2 + (i % 3),
            city='Ahmedabad',
            locality='South Bopal',
            address=f'{i+1} Test Street, South Bopal',
            status='active',
        )
        p.save()
        props.append(p)
    yield props
    for p in props:
        p.delete()


@pytest.mark.django_db
class TestCompareModule:

    def setup_method(self):
        PropertyCompare.objects.delete()

    def test_get_compare_empty_for_guest(self, api_client):
        res = api_client.get('/api/buyer/compare/')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert res.data['data']['property_ids'] == []
        assert res.data['data']['properties'] == []

    def test_get_compare_by_query_params_guest(self, api_client, sample_properties):
        p1_id = str(sample_properties[0].id)
        p2_id = str(sample_properties[1].id)
        res = api_client.get(f'/api/buyer/compare/?property_ids={p1_id},{p2_id}')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert len(res.data['data']['properties']) == 2
        assert res.data['data']['properties'][0]['id'] == p1_id
        assert res.data['data']['properties'][1]['id'] == p2_id

    def test_add_to_compare_authenticated(self, api_client, sample_buyer, sample_properties):
        api_client.force_authenticate(user=sample_buyer)
        p1_id = str(sample_properties[0].id)

        res = api_client.post('/api/buyer/compare/', {'property_id': p1_id}, format='json')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert p1_id in res.data['data']['property_ids']
        assert len(res.data['data']['properties']) == 1

        # Verify DB persistence
        repo = PropertyCompareRepository()
        user_compare_ids = repo.find_by_user(str(sample_buyer.id))
        assert p1_id in user_compare_ids

    def test_sync_compare_list_authenticated(self, api_client, sample_buyer, sample_properties):
        api_client.force_authenticate(user=sample_buyer)
        p_ids = [str(p.id) for p in sample_properties[:3]]

        res = api_client.post('/api/buyer/compare/', {'property_ids': p_ids}, format='json')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert len(res.data['data']['property_ids']) == 3
        assert res.data['data']['property_ids'] == p_ids

    def test_compare_limit_12_properties(self, api_client, sample_buyer, sample_properties):
        api_client.force_authenticate(user=sample_buyer)
        service = BuyerService()

        # Add 12 properties
        for p in sample_properties[:12]:
            service.add_to_compare(str(sample_buyer.id), str(p.id))

        # Attempt to add 13th property should raise ValidationError
        with pytest.raises(Exception):
            service.add_to_compare(str(sample_buyer.id), str(sample_properties[12].id))

        # Ensure database count remains 12
        repo = PropertyCompareRepository()
        assert len(repo.find_by_user(str(sample_buyer.id))) == 12

    def test_remove_from_compare(self, api_client, sample_buyer, sample_properties):
        api_client.force_authenticate(user=sample_buyer)
        p1_id = str(sample_properties[0].id)
        p2_id = str(sample_properties[1].id)

        # Add two properties
        api_client.post('/api/buyer/compare/', {'property_id': p1_id}, format='json')
        api_client.post('/api/buyer/compare/', {'property_id': p2_id}, format='json')

        # Remove p1
        res = api_client.delete(f'/api/buyer/compare/?property_id={p1_id}')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert p1_id not in res.data['data']['property_ids']
        assert p2_id in res.data['data']['property_ids']

    def test_clear_compare_list(self, api_client, sample_buyer, sample_properties):
        api_client.force_authenticate(user=sample_buyer)
        p_ids = [str(p.id) for p in sample_properties[:4]]
        api_client.post('/api/buyer/compare/', {'property_ids': p_ids}, format='json')

        # Clear all
        res = api_client.delete('/api/buyer/compare/')
        assert res.status_code == 200
        assert res.data['success'] is True
        assert res.data['data']['property_ids'] == []
        assert res.data['data']['properties'] == []

    def test_per_buyer_data_isolation(self, api_client, sample_buyer, sample_buyer_2, sample_properties):
        p1_id = str(sample_properties[0].id)
        p2_id = str(sample_properties[1].id)

        # Buyer 1 adds property 1
        api_client.force_authenticate(user=sample_buyer)
        api_client.post('/api/buyer/compare/', {'property_id': p1_id}, format='json')

        # Buyer 2 adds property 2
        api_client.force_authenticate(user=sample_buyer_2)
        api_client.post('/api/buyer/compare/', {'property_id': p2_id}, format='json')

        # Check Buyer 1 list
        api_client.force_authenticate(user=sample_buyer)
        res1 = api_client.get('/api/buyer/compare/')
        assert res1.data['data']['property_ids'] == [p1_id]

        # Check Buyer 2 list
        api_client.force_authenticate(user=sample_buyer_2)
        res2 = api_client.get('/api/buyer/compare/')
        assert res2.data['data']['property_ids'] == [p2_id]
