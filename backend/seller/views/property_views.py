"""
seller/views/property_views.py — API Views for Seller Property Management
"""

from core.base.view import BaseAPIView
from common.responses import paginated_response
from seller.services.property_service import PropertyService
from seller.serializers.property_serializer import (
    PropertyCreateUpdateSerializer,
    PropertyResponseSerializer,
    PropertyStatusUpdateSerializer,
)
from core.exceptions.base import ValidationError
from accounts.permissions import IsSeller


class PropertyListCreateView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def get(self, request):
        """GET /api/seller/properties/ — Filter, search, sort, and paginate properties."""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        search = request.query_params.get('search')
        sort_by = request.query_params.get('sort_by', '-created_at')

        filters = {}
        if request.query_params.get('property_type'):
            filters['property_type'] = request.query_params.get('property_type')
        if request.query_params.get('listing_type'):
            filters['listing_type'] = request.query_params.get('listing_type')
        if request.query_params.get('city'):
            filters['city__icontains'] = request.query_params.get('city')
        if request.query_params.get('status'):
            filters['status'] = request.query_params.get('status')
        if request.query_params.get('min_price'):
            filters['price__gte'] = float(request.query_params.get('min_price'))
        if request.query_params.get('max_price'):
            filters['price__lte'] = float(request.query_params.get('max_price'))

        results, total_count = self.service.list_properties(
            filters=filters,
            search_query=search,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
            seller_id=str(request.user.id),
        )

        serialized = PropertyResponseSerializer(results, many=True).data
        return paginated_response(
            results=serialized,
            count=total_count,
            page=page,
            page_size=page_size,
            message="Properties retrieved successfully."
        )

    def post(self, request):
        """POST /api/seller/properties/ — Create a new property."""
        serializer = PropertyCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)
        
        property_data = {
            **serializer.validated_data,
            'seller_id': str(request.user.id),
            'seller_name': request.user.full_name,
            'phone_number': request.user.phone_number,
            'email': request.user.email,
        }
        result = self.service.create_property(property_data)
        response_data = PropertyResponseSerializer(result).data

        return self.created_response(
            data=response_data,
            message="Property created successfully."
        )


class PropertyDetailView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def get(self, request, pk):
        """GET /api/seller/properties/<pk>/ — Retrieve single property details."""
        result = self.service.get_property_by_id(pk, seller_id=str(request.user.id))
        response_data = PropertyResponseSerializer(result).data
        response_data['performance'] = self.service.get_property_performance(
            pk,
            seller_id=str(request.user.id),
        )
        return self.success_response(
            data=response_data,
            message="Property details retrieved."
        )

    def put(self, request, pk):
        """PUT /api/seller/properties/<pk>/ — Full update property."""
        serializer = PropertyCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.update_property(pk, serializer.validated_data, seller_id=str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message="Property updated successfully."
        )

    def delete(self, request, pk):
        """DELETE /api/seller/properties/<pk>/ — Soft-delete property."""
        self.service.delete_property(pk, seller_id=str(request.user.id))
        return self.success_response(
            data={},
            message="Property deleted successfully."
        )


class PropertyStatusUpdateView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def patch(self, request, pk):
        serializer = PropertyStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message='Validation failed.', errors=serializer.errors)

        result = self.service.update_property_status(
            pk,
            serializer.validated_data['status'],
            seller_id=str(request.user.id),
        )
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message='Property status updated successfully.',
        )


class PropertyImageUploadView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def post(self, request, pk):
        """POST /api/seller/properties/<pk>/images/ — Upload image files."""
        files = request.FILES.getlist('images')
        if not files:
            raise ValidationError("No image files provided in request. Key name must be 'images'.")

        result = self.service.upload_images(pk, files, seller_id=str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message=f"Uploaded {len(files)} images successfully."
        )


class PropertyImageDeleteView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def delete(self, request, pk, image_id):
        """DELETE /api/seller/properties/<pk>/images/<image_id>/ — Delete image."""
        result = self.service.delete_image(pk, image_id, seller_id=str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message="Image deleted successfully."
        )


class PropertyCoverImageView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def put(self, request, pk, image_id):
        """PUT /api/seller/properties/<pk>/images/<image_id>/cover/ — Set primary cover image."""
        result = self.service.set_cover_image(pk, image_id, seller_id=str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message="Cover image set successfully."
        )


class PropertyBrochureUploadView(BaseAPIView):
    permission_classes = [IsSeller]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PropertyService()

    def post(self, request, pk):
        """POST /api/seller/properties/<pk>/brochure/ — Upload PDF brochure."""
        file_obj = request.FILES.get('brochure')
        if not file_obj:
            raise ValidationError("No brochure file provided in request. Key name must be 'brochure'.")

        result = self.service.upload_brochure(pk, file_obj, seller_id=str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message="Brochure uploaded successfully."
        )
