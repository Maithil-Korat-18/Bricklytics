"""
accounts/repositories/user_repository.py — Data Access Layer for Users
"""

from core.base.repository import BaseRepository
from accounts.models.user import User
from core.exceptions.base import ResourceNotFoundError


class UserRepository(BaseRepository):
    model = User

    def find_by_email(self, email: str) -> User | None:
        """Find active user by email case-insensitively."""
        try:
            return self.model.active().get(email__iexact=email.strip().lower())
        except self.model.DoesNotExist:
            return None

    def get_by_email(self, email: str) -> User:
        """Find user by email or raise ResourceNotFoundError."""
        user = self.find_by_email(email)
        if not user:
            raise ResourceNotFoundError(f"User with email '{email}' not found.", resource="User", resource_id=email)
        return user
