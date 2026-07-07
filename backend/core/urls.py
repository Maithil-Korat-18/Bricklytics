from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    MatchScoreView,
    PropertyViewSet,
    RankedPropertiesView,
    UserPreferenceProfileViewSet,
)
from core.views_auth import (
    RegisterSendCodeView,
    RegisterVerifyCodeView,
    RegisterCompleteView,
    LoginView,
    ForgotSendCodeView,
    ForgotVerifyCodeView,
    ForgotResetPasswordView,
    CSRFTokenView,
    LogoutView,
)

router = DefaultRouter()
router.register(r"properties", PropertyViewSet, basename="property")
router.register(r"preference-profiles", UserPreferenceProfileViewSet, basename="preferenceprofile")

urlpatterns = [
    path("", include(router.urls)),
    path("properties/<int:property_id>/match-score/", MatchScoreView.as_view(), name="match-score"),
    path("properties/ranked/", RankedPropertiesView.as_view(), name="ranked-properties"),
    
    # Authentication endpoints
    path("auth/csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("auth/register/send-code/", RegisterSendCodeView.as_view(), name="register-send-code"),
    path("auth/register/verify-code/", RegisterVerifyCodeView.as_view(), name="register-verify-code"),
    path("auth/register/complete/", RegisterCompleteView.as_view(), name="register-complete"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/forgot/send-code/", ForgotSendCodeView.as_view(), name="forgot-send-code"),
    path("auth/forgot/verify-code/", ForgotVerifyCodeView.as_view(), name="forgot-verify-code"),
    path("auth/forgot/reset-password/", ForgotResetPasswordView.as_view(), name="forgot-reset-password"),
]

