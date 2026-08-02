"""
seller/urls/property_urls.py — Property Routes
"""

from django.urls import path
from seller.views.property_views import (
    PropertyListCreateView,
    PropertyDetailView,
    PropertyStatusUpdateView,
    PropertyImageUploadView,
    PropertyImageDeleteView,
    PropertyCoverImageView,
    PropertyBrochureUploadView,
)
from seller.views.prediction_views import (
    PredictPriceView,
    PredictConditionView,
    AhmedabadLocationsView,
    PredictAppreciationView,
    PredictionHistoryView,
)

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    
    # ML condition & location helper endpoints (before <str:pk>/)
    path('predict-condition/', PredictConditionView.as_view(), name='property-predict-condition'),
    path('locations/', AhmedabadLocationsView.as_view(), name='property-locations'),

    path('<str:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<str:pk>/status/', PropertyStatusUpdateView.as_view(), name='property-status-update'),
    path('<str:pk>/images/', PropertyImageUploadView.as_view(), name='property-image-upload'),
    path('<str:pk>/images/<str:image_id>/', PropertyImageDeleteView.as_view(), name='property-image-delete'),
    path('<str:pk>/images/<str:image_id>/cover/', PropertyCoverImageView.as_view(), name='property-image-cover'),
    path('<str:pk>/brochure/', PropertyBrochureUploadView.as_view(), name='property-brochure-upload'),

    # ML Property-specific Prediction endpoints
    path('<str:pk>/predict-price/', PredictPriceView.as_view(), name='property-predict-price'),
    path('<str:pk>/predict-appreciation/', PredictAppreciationView.as_view(), name='property-predict-appreciation'),
    path('<str:pk>/predictions/', PredictionHistoryView.as_view(), name='property-prediction-history'),
]
