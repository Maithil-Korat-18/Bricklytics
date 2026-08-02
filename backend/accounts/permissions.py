"""
accounts/permissions.py — DRF Role-Based Permissions
"""

from rest_framework.permissions import BasePermission


class IsAuthenticated(BasePermission):
    """Allows access only to authenticated users."""
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_active', False))


class IsBuyer(BasePermission):
    """Allows access only to authenticated users with role='buyer'."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, 'is_active', False) and 
            getattr(request.user, 'role', '') == 'buyer'
        )


class IsSeller(BasePermission):
    """Allows access only to authenticated users with role='seller'."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, 'is_active', False) and 
            getattr(request.user, 'role', '') == 'seller'
        )
