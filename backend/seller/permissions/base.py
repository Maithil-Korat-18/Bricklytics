"""
seller/permissions/base.py — Base Seller Permissions
=====================================================
Placeholder permission classes.
Extend these once authentication is implemented.
"""

from rest_framework.permissions import BasePermission


class IsSellerOwner(BasePermission):
    """
    Grants access only to the seller who owns the resource.
    Full implementation requires authentication.
    Currently allows all (permissive) for architecture setup only.
    """
    message = 'You do not have permission to access this resource.'

    def has_permission(self, request, view) -> bool:
        # TODO: implement after auth is wired up
        # return request.user and request.user.role == 'seller'
        return True

    def has_object_permission(self, request, view, obj) -> bool:
        # TODO: return obj.seller_id == str(request.user.id)
        return True


class IsVerifiedSeller(BasePermission):
    """Grants access only to sellers who have completed verification."""
    message = 'Your seller account is not yet verified.'

    def has_permission(self, request, view) -> bool:
        # TODO: return request.user.is_verified
        return True
