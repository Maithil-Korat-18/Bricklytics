"""
accounts/services/auth_service.py — Business Logic Layer for Authentication
"""

import random
import logging
from datetime import datetime, timedelta, timezone
from core.base.service import BaseService
from accounts.repositories.user_repository import UserRepository
from accounts.services.email_service import EmailService
from accounts.middleware.jwt_auth import generate_jwt_token
from accounts.serializers.auth_serializer import UserResponseSerializer
from core.exceptions.base import (
    ConflictError,
    ValidationError,
    AuthenticationError,
    ResourceNotFoundError,
)

logger = logging.getLogger('bricklytics.auth')


class AuthService(BaseService):
    def __init__(self, user_repo: UserRepository = None):
        super().__init__()
        self.user_repo = user_repo or UserRepository()

    def signup(self, data: dict) -> dict:
        email = data['email']
        self._log_operation('signup', email=email, role=data.get('role'))

        existing_user = self.user_repo.find_by_email(email)
        if existing_user:
            raise ConflictError("An account with this email address already exists.")

        raw_password = data.pop('password')
        
        # Generate 6-digit verification code
        code = f"{random.randint(100000, 999999)}"
        code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        from django.contrib.auth.hashers import make_password

        import os
        auto_verify = os.getenv('AUTO_VERIFY_USERS', 'True').lower() in ('true', '1', 't')

        user_data = {
            **data,
            'password_hash': make_password(raw_password),
            'is_verified': auto_verify,
            'is_active': True,
            'verification_code': code,
            'verification_code_expires_at': code_expires_at,
            'failed_verification_attempts': 0,
        }

        user_dict = self.user_repo.create(user_data)
        user = self.user_repo.model.get_or_404(user_dict['id'])

        # Send Real Verification Email
        EmailService.send_verification_email(
            email=user.email,
            name=user.full_name,
            code=code
        )

        serialized_user = UserResponseSerializer(user.to_dict()).data
        return {
            'user': serialized_user,
            'message': 'Signup successful. A 6-digit verification code has been sent to your email.'
        }

    def verify_email(self, email: str, code: str) -> dict:
        self._log_operation('verify_email', email=email)
        user = self.user_repo.find_by_email(email)
        if not user:
            raise ResourceNotFoundError("User with specified email was not found.", resource="User", resource_id=email)

        if user.is_verified:
            token = generate_jwt_token(user)
            return {
                'user': UserResponseSerializer(user.to_dict()).data,
                'token': token,
                'message': 'Account is already verified.'
            }

        if user.failed_verification_attempts >= 5:
            raise ValidationError("Maximum verification attempts exceeded. Please click 'Resend Code'.")

        now = datetime.now(timezone.utc)
        if user.verification_code_expires_at and user.verification_code_expires_at.replace(tzinfo=timezone.utc) < now:
            raise ValidationError("Verification code has expired. Please request a new code.")

        if user.verification_code != code.strip():
            user.failed_verification_attempts += 1
            user.save()
            remaining = max(0, 5 - user.failed_verification_attempts)
            raise ValidationError(f"Invalid verification code. {remaining} attempts remaining.")

        # Account Verification Successful
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires_at = None
        user.failed_verification_attempts = 0
        user.save()

        token = generate_jwt_token(user)
        return {
            'user': UserResponseSerializer(user.to_dict()).data,
            'token': token,
            'message': 'Email verified successfully!'
        }

    def resend_code(self, email: str) -> dict:
        self._log_operation('resend_code', email=email)
        user = self.user_repo.find_by_email(email)
        if not user:
            raise ResourceNotFoundError("User with specified email was not found.", resource="User", resource_id=email)

        if user.is_verified:
            raise ConflictError("Account is already verified.")

        code = f"{random.randint(100000, 999999)}"
        code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        user.verification_code = code
        user.verification_code_expires_at = code_expires_at
        user.failed_verification_attempts = 0
        user.save()

        EmailService.send_verification_email(
            email=user.email,
            name=user.full_name,
            code=code
        )

        return {
            'message': 'A new 6-digit verification code has been sent to your email.'
        }

    def login(self, email: str, raw_password: str) -> dict:
        self._log_operation('login', email=email)
        user = self.user_repo.find_by_email(email)
        if not user or not user.check_password(raw_password):
            raise AuthenticationError("Invalid email address or password.")

        if not user.is_verified:
            import os
            if os.getenv('AUTO_VERIFY_USERS', 'True').lower() in ('true', '1', 't'):
                user.is_verified = True
                user.save()
            else:
                raise AuthenticationError("Your email address is not verified. Please verify your email first.")

        if not user.is_active:
            raise AuthenticationError("Your account has been deactivated. Please contact support.")

        token = generate_jwt_token(user)
        return {
            'user': UserResponseSerializer(user.to_dict()).data,
            'token': token,
            'message': 'Login successful.'
        }

    def forgot_password(self, email: str) -> dict:
        self._log_operation('forgot_password', email=email)
        user = self.user_repo.find_by_email(email)
        if not user:
            # For security, return success message even if email is not found
            return {'message': 'If an account exists with this email, a reset OTP code has been sent.'}

        code = f"{random.randint(100000, 999999)}"
        code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        user.reset_code = code
        user.reset_code_expires_at = code_expires_at
        user.save()

        EmailService.send_password_reset_email(
            email=user.email,
            name=user.full_name,
            code=code
        )

        return {'message': 'A 6-digit password reset OTP has been sent to your email.'}

    def reset_password(self, email: str, code: str, new_password: str) -> dict:
        self._log_operation('reset_password', email=email)
        user = self.user_repo.find_by_email(email)
        if not user:
            raise ResourceNotFoundError("User with specified email was not found.", resource="User", resource_id=email)

        now = datetime.now(timezone.utc)
        if not user.reset_code_expires_at or user.reset_code_expires_at.replace(tzinfo=timezone.utc) < now:
            raise ValidationError("Password reset code has expired. Please request a new reset code.")

        if user.reset_code != code.strip():
            raise ValidationError("Invalid password reset code.")

        user.set_password(new_password)
        user.reset_code = None
        user.reset_code_expires_at = None
        user.save()

        return {'message': 'Password has been reset successfully. You can now log in with your new password.'}
