"""
accounts/views/auth_views.py — API Controllers for Authentication
"""

from core.base.view import BaseAPIView
from accounts.services.auth_service import AuthService
from accounts.serializers.auth_serializer import (
    SignupSerializer,
    LoginSerializer,
    VerifyEmailSerializer,
    ResendCodeSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserResponseSerializer,
)
from accounts.permissions import IsAuthenticated
from core.exceptions.base import ValidationError


class SignupView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.signup(serializer.validated_data)
        return self.created_response(data=result, message=result['message'])


class VerifyEmailView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.verify_email(
            email=serializer.validated_data['email'],
            code=serializer.validated_data['code']
        )
        return self.success_response(data=result, message=result['message'])


class ResendCodeView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = ResendCodeSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.resend_code(email=serializer.validated_data['email'])
        return self.success_response(data=result, message=result['message'])


class LoginView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.login(
            email=serializer.validated_data['email'],
            raw_password=serializer.validated_data['password']
        )
        return self.success_response(data=result, message=result['message'])


class ForgotPasswordView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.forgot_password(email=serializer.validated_data['email'])
        return self.success_response(data=result, message=result['message'])


class ResetPasswordView(BaseAPIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(message="Validation failed.", errors=serializer.errors)

        result = self.service.reset_password(
            email=serializer.validated_data['email'],
            code=serializer.validated_data['code'],
            new_password=serializer.validated_data['new_password']
        )
        return self.success_response(data=result, message=result['message'])


class MeView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_dict = request.user.to_dict()
        return self.success_response(
            data=UserResponseSerializer(user_dict).data,
            message="Current user profile fetched successfully."
        )


class LogoutView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return self.success_response(
            data={},
            message="Logged out successfully."
        )
