"""
seller/tests/test_property_module.py — Integration and Unit Tests for Seller Property Module
"""

import io
from PIL import Image
from django.test import TestCase
from rest_framework.test import APIClient
from seller.models.property import Property


class PropertyModuleTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_payload = {
            "title": "Luxury Modern Villa",
            "description": "Spacious 4 BHK Villa with private garden",
            "property_type": "villa",
            "listing_type": "sell",
            "price": 15000000.0,
            "bedrooms": 4,
            "bathrooms": 4,
            "area_sqft": 3200.0,
            "year_built": 2022,
            "address": "Road No. 12, Jubilee Hills",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500033",
            "amenities": [
                {"name": "Swimming Pool", "category": "Luxury"}
            ]
        }

    def tearDown(self):
        Property.objects.all().delete()

    def test_create_property_success(self):
        response = self.client.post('/api/seller/properties/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['title'], "Luxury Modern Villa")
        self.assertIn('id', data['data'])

    def test_create_property_validation_failure(self):
        invalid_payload = {**self.valid_payload, "price": -500}
        response = self.client.post('/api/seller/properties/', invalid_payload, format='json')
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])

    def test_list_and_filter_properties(self):
        self.client.post('/api/seller/properties/', self.valid_payload, format='json')
        
        response = self.client.get('/api/seller/properties/?city=Hyderabad&property_type=villa')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['count'], 1)

    def test_get_update_delete_property_detail(self):
        create_res = self.client.post('/api/seller/properties/', self.valid_payload, format='json')
        prop_id = create_res.json()['data']['id']

        # Get
        get_res = self.client.get(f'/api/seller/properties/{prop_id}/')
        self.assertEqual(get_res.status_code, 200)

        # Update
        update_payload = {**self.valid_payload, "title": "Updated Modern Villa"}
        put_res = self.client.put(f'/api/seller/properties/{prop_id}/', update_payload, format='json')
        self.assertEqual(put_res.status_code, 200)
        self.assertEqual(put_res.json()['data']['title'], "Updated Modern Villa")

        # Soft Delete
        del_res = self.client.delete(f'/api/seller/properties/{prop_id}/')
        self.assertEqual(del_res.status_code, 200)

        # Confirm non-accessible post delete
        get_res_post_del = self.client.get(f'/api/seller/properties/{prop_id}/')
        self.assertEqual(get_res_post_del.status_code, 404)

        list_res = self.client.get('/api/seller/properties/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(list_res.json()['data']['count'], 0)

    def test_analytics_returns_standardized_metrics(self):
        self.client.post('/api/seller/properties/', self.valid_payload, format='json')

        response = self.client.get('/api/seller/analytics/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['total_properties'], 1)
        self.assertIn('average_price', data['data'])
        self.assertIn('status_counts', data['data'])

    def test_upload_image_validation(self):
        create_res = self.client.post('/api/seller/properties/', self.valid_payload, format='json')
        prop_id = create_res.json()['data']['id']

        # Mock image file
        file_obj = io.BytesIO()
        img = Image.new('RGB', (100, 100), color='blue')
        img.save(file_obj, 'jpeg')
        file_obj.name = 'test.jpg'
        file_obj.seek(0)

        response = self.client.post(
            f'/api/seller/properties/{prop_id}/images/',
            {'images': [file_obj]},
            format='multipart'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['data']['images']), 1)
        self.assertTrue(data['data']['images'][0]['is_cover'])
