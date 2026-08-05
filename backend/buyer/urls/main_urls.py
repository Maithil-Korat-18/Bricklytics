"""
buyer/urls/main_urls.py — Buyer Module Main URL Router
======================================================
All buyer endpoints are prefixed with /api/buyer/
"""

from django.urls import path
from buyer.views.buyer_views import (
    BuyerDashboardView,
    BuyerPropertyListView,
    BuyerPropertyDetailView,
    WishlistView,
    WishlistDeleteView,
    SavedSearchView,
    SavedSearchDeleteView,
    ScheduleVisitView,
    PropertyCompareView,
    RecentlyViewedView,
    BetterAlternativesView,
    TopPropertiesView,
)

app_name = 'buyer'

urlpatterns = [
    path('dashboard/', BuyerDashboardView.as_view(), name='buyer-dashboard'),
    path('properties/', BuyerPropertyListView.as_view(), name='buyer-property-list'),
    path('properties/<str:pk>/', BuyerPropertyDetailView.as_view(), name='buyer-property-detail'),
    path('properties/<str:pk>/alternatives/', BetterAlternativesView.as_view(), name='buyer-property-alternatives'),
    path('wishlist/', WishlistView.as_view(), name='buyer-wishlist'),
    path('wishlist/<str:property_id>/', WishlistDeleteView.as_view(), name='buyer-wishlist-delete'),
    path('saved-searches/', SavedSearchView.as_view(), name='buyer-saved-searches'),
    path('saved-searches/<str:pk>/', SavedSearchDeleteView.as_view(), name='buyer-saved-search-delete'),
    path('schedule-visit/', ScheduleVisitView.as_view(), name='buyer-schedule-visit'),
    path('compare/', PropertyCompareView.as_view(), name='buyer-compare'),
    path('recently-viewed/', RecentlyViewedView.as_view(), name='buyer-recently-viewed'),
    path('top-properties/', TopPropertiesView.as_view(), name='buyer-top-properties'),
]

