"""
seller/tests/test_setup.py — Architecture Smoke Tests
======================================================
Verify that the backend foundation is correctly wired before
building any business logic.

Run with:
    python manage.py test seller.tests.test_setup
    -- or --
    pytest seller/tests/test_setup.py
"""

from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient


class ArchitectureSetupTest(TestCase):
    """Verify core imports and base class availability."""

    def test_core_base_document_importable(self):
        from core.base.document import BaseDocument
        self.assertTrue(hasattr(BaseDocument, 'get_or_404'))
        self.assertTrue(hasattr(BaseDocument, 'soft_delete'))

    def test_core_base_serializer_importable(self):
        from core.base.serializer import BaseSerializer, BaseModelSerializer
        self.assertIsNotNone(BaseSerializer)
        self.assertIsNotNone(BaseModelSerializer)

    def test_core_base_view_importable(self):
        from core.base.view import BaseAPIView
        self.assertTrue(hasattr(BaseAPIView, 'success_response'))
        self.assertTrue(hasattr(BaseAPIView, 'error_response'))

    def test_core_base_service_importable(self):
        from core.base.service import BaseService
        self.assertIsNotNone(BaseService)

    def test_core_base_repository_importable(self):
        from core.base.repository import BaseRepository
        self.assertIsNotNone(BaseRepository)

    def test_core_exceptions_importable(self):
        from core.exceptions.base import (
            BricklyticsBaseException,
            ValidationError,
            ResourceNotFoundError,
            DatabaseError,
        )
        self.assertIsNotNone(BricklyticsBaseException)

    def test_common_responses_importable(self):
        from common.responses import (
            success_response,
            error_response,
            paginated_response,
        )
        self.assertIsNotNone(success_response)

    def test_common_validators_importable(self):
        from common import validators
        self.assertTrue(validators.is_valid_email('test@example.com'))
        self.assertFalse(validators.is_valid_email('invalid'))
        self.assertTrue(validators.is_valid_price(100_000))
        self.assertFalse(validators.is_valid_price(-1))

    def test_common_utils_importable(self):
        from common.utils import generate_uuid, slugify, utc_now
        self.assertTrue(len(generate_uuid()) == 36)
        self.assertEqual(slugify('Hello World'), 'hello-world')
        self.assertIsNotNone(utc_now())

    def test_seller_base_model_importable(self):
        from seller.models.base import SellerBaseDocument
        self.assertIsNotNone(SellerBaseDocument)

    def test_seller_permissions_importable(self):
        from seller.permissions.base import IsSellerOwner, IsVerifiedSeller
        self.assertIsNotNone(IsSellerOwner)

    def test_seller_validators_importable(self):
        from seller.validators.base import PropertyValidator
        self.assertIsNotNone(PropertyValidator)


class HealthCheckTest(TestCase):
    """Test the /api/health/ endpoint."""

    def setUp(self):
        self.client = APIClient()

    def test_health_endpoint_exists(self):
        response = self.client.get('/api/health/')
        self.assertIn(response.status_code, [200, 503])
        data = response.json()
        self.assertIn('success', data)
        self.assertIn('message', data)
        self.assertIn('data', data)

    def test_health_response_has_database_key(self):
        response = self.client.get('/api/health/')
        data = response.json()
        self.assertIn('database', data['data'])
