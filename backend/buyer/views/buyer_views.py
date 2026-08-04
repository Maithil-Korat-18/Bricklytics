"""
buyer/views/buyer_views.py — API Controllers for Buyer Module
"""

from core.base.view import BaseAPIView
from common.responses import paginated_response
from buyer.services.buyer_service import BuyerService
from seller.services.property_service import PropertyService
from seller.serializers.property_serializer import PropertyResponseSerializer
from buyer.serializers.buyer_serializer import (
    WishlistCreateSerializer,
    SavedSearchCreateSerializer,
    VisitScheduleCreateSerializer,
    VisitScheduleResponseSerializer,
    SavedSearchResponseSerializer,
)
from accounts.permissions import IsAuthenticated, IsBuyer
from core.exceptions.base import ValidationError, ResourceNotFoundError


class BuyerDashboardView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def get(self, request):
        dashboard_data = self.service.get_dashboard(request.user)
        return self.success_response(
            data=dashboard_data,
            message="Buyer dashboard data fetched successfully."
        )


class BuyerPropertyListView(BaseAPIView):
    """
    Public Property Search & Browsing for Buyers
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.property_service = PropertyService()

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        search = request.query_params.get('search')
        sort_by = request.query_params.get('sort_by', '-created_at')

        filters = {'status': 'active'}
        if request.query_params.get('property_type'):
            filters['property_type'] = request.query_params.get('property_type')
        if request.query_params.get('bhk'):
            filters['bhk'] = int(request.query_params.get('bhk'))
        if request.query_params.get('locality'):
            filters['locality__icontains'] = request.query_params.get('locality')
        if request.query_params.get('city'):
            filters['city__icontains'] = request.query_params.get('city')
        if request.query_params.get('min_price'):
            filters['price__gte'] = float(request.query_params.get('min_price'))
        if request.query_params.get('max_price'):
            filters['price__lte'] = float(request.query_params.get('max_price'))

        buyer_svc = BuyerService()

        # If sorting by investment score, query all matching without DB sort first then sort in memory
        db_sort = sort_by if sort_by not in ['investment_score', '-investment_score'] else '-created_at'

        results, total_count = self.property_service.list_properties(
            filters=filters,
            search_query=search,
            sort_by=db_sort,
            page=page,
            page_size=page_size,
        )

        enriched_results = [buyer_svc.enrich_property(p) for p in results]

        if sort_by == '-investment_score':
            enriched_results.sort(key=lambda x: x.get('investment_score', 0), reverse=True)
        elif sort_by == 'investment_score':
            enriched_results.sort(key=lambda x: x.get('investment_score', 0))

        min_score = request.query_params.get('min_investment_score')
        if min_score:
            try:
                min_score_val = int(min_score)
                enriched_results = [p for p in enriched_results if p.get('investment_score', 0) >= min_score_val]
            except ValueError:
                pass

        serialized = PropertyResponseSerializer(enriched_results, many=True).data
        return paginated_response(
            results=serialized,
            count=total_count,
            page=page,
            page_size=page_size,
            message="Buyer property search results."
        )


class BuyerPropertyDetailView(BaseAPIView):
    """
    Property Detail Page for Buyers
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.property_service = PropertyService()
        self.buyer_service = BuyerService()

    def get(self, request, pk):
        result = self.property_service.get_property_by_id(pk)
        if result.get('status') != 'active':
            raise ResourceNotFoundError('Property not found.', resource='Property', resource_id=pk)
        
        # Record recent view if user is logged in
        if request.user:
            self.buyer_service.record_view(str(request.user.id), pk)

        return self.success_response(
            data=PropertyResponseSerializer(result).data,
            message="Property details fetched."
        )


class WishlistView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def get(self, request):
        items = self.service.get_wishlist(str(request.user.id))
        return self.success_response(
            data=items,
            message="User wishlist retrieved."
        )

    def post(self, request):
        serializer = WishlistCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        res = self.service.toggle_wishlist(
            user_id=str(request.user.id),
            property_id=serializer.validated_data['property_id']
        )
        return self.success_response(data=res, message=res['message'])


class WishlistDeleteView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def delete(self, request, property_id):
        res = self.service.remove_wishlist(user_id=str(request.user.id), property_id=property_id)
        return self.success_response(data=res, message="Property removed from wishlist.")


class SavedSearchView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def get(self, request):
        searches = self.service.get_saved_searches(str(request.user.id))
        return self.success_response(
            data=SavedSearchResponseSerializer(searches, many=True).data,
            message="Saved searches fetched."
        )

    def post(self, request):
        serializer = SavedSearchCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        res = self.service.save_search(
            user_id=str(request.user.id),
            title=serializer.validated_data['title'],
            filters=serializer.validated_data['filters']
        )
        return self.created_response(
            data=SavedSearchResponseSerializer(res).data,
            message="Search saved successfully."
        )


class SavedSearchDeleteView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def delete(self, request, pk):
        self.service.delete_saved_search(str(request.user.id), pk)
        return self.success_response(data={}, message="Saved search deleted.")


class ScheduleVisitView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def get(self, request):
        visits = self.service.get_scheduled_visits(str(request.user.id))
        return self.success_response(
            data=VisitScheduleResponseSerializer(visits, many=True).data,
            message="Scheduled visits fetched."
        )

    def post(self, request):
        serializer = VisitScheduleCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        visit = self.service.schedule_visit(request.user, serializer.validated_data)
        return self.created_response(
            data=VisitScheduleResponseSerializer(visit).data,
            message="Visit scheduled successfully. The seller will confirm shortly."
        )


class PropertyCompareView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def post(self, request):
        property_ids = request.data.get('property_ids', [])
        if not isinstance(property_ids, list) or not property_ids:
            raise ValidationError("property_ids must be a non-empty array of property IDs.")

        compared = self.service.compare_properties(property_ids)
        return self.success_response(
            data=PropertyResponseSerializer(compared, many=True).data,
            message="Properties compared successfully."
        )


class RecentlyViewedView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BuyerService()

    def get(self, request):
        props = self.service.get_recently_viewed(str(request.user.id))
        return self.success_response(
            data=PropertyResponseSerializer(props, many=True).data,
            message="Recently viewed properties fetched."
        )
