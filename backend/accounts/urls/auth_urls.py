"""
accounts/urls/auth_urls.py — Authentication Routes
===================================================
All auth routes are prefixed with /api/auth/
"""

from django.urls import path
from accounts.views.auth_views import (
    SignupView,
    VerifyEmailView,
    ResendCodeView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    LogoutView,
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='auth-signup'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-code/', ResendCodeView.as_view(), name='auth-resend-code'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
]
