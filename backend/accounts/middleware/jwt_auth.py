"""
accounts/middleware/jwt_auth.py — JWT Authentication System
"""

import jwt
import logging
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from core.exceptions.base import AuthenticationError, ResourceNotFoundError
from accounts.models.user import User

logger = logging.getLogger('bricklytics.auth')

JWT_SECRET = getattr(settings, 'JWT_SECRET_KEY', 'bricklytics-jwt-secret-key-prod-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = int(getattr(settings, 'JWT_EXPIRATION_HOURS', 24))


def generate_jwt_token(user: User) -> str:
    """Generate a signed JWT token containing user identity and role."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'full_name': user.full_name,
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    """Decode and validate JWT token signature and expiration."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid authentication token.")


class JWTAuthentication(BaseAuthentication):
    """
    DRF Authentication Backend for Bearer JWT Tokens.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        payload = decode_jwt_token(token)

        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationError("Malformed token payload.")

        try:
            user = User.get_or_404(user_id)
            if not user.is_active:
                raise AuthenticationError("User account has been deactivated.")
            return (user, token)
        except ResourceNotFoundError:
            raise AuthenticationError("User associated with token no longer exists.")
        except AuthenticationError:
            raise
        except Exception as exc:
            logger.exception("Unexpected error in JWT authentication: %s", exc)
            raise AuthenticationError("User associated with token no longer exists.")
