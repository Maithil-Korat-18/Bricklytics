"""
buyer/repositories/buyer_repository.py — Data Access for Buyer Collections
"""

from core.base.repository import BaseRepository
from buyer.models.wishlist import Wishlist
from buyer.models.saved_search import SavedSearch
from buyer.models.visit_schedule import VisitSchedule
from buyer.models.property_view import PropertyView


class WishlistRepository(BaseRepository):
    model = Wishlist

    def find_by_user(self, user_id: str) -> list[dict]:
        return self.find_all(filters={'user_id': user_id}, limit=500)

    def is_in_wishlist(self, user_id: str, property_id: str) -> bool:
        return self.model.active().filter(user_id=user_id, property_id=property_id).count() > 0

    def remove_from_wishlist(self, user_id: str, property_id: str) -> bool:
        items = self.model.active().filter(user_id=user_id, property_id=property_id)
        for item in items:
            item.soft_delete()
        return True


class SavedSearchRepository(BaseRepository):
    model = SavedSearch

    def find_by_user(self, user_id: str) -> list[dict]:
        return self.find_all(filters={'user_id': user_id}, limit=100)


class VisitScheduleRepository(BaseRepository):
    model = VisitSchedule

    def find_by_user(self, user_id: str) -> list[dict]:
        return self.find_all(filters={'user_id': user_id}, limit=100)


class PropertyViewRepository(BaseRepository):
    model = PropertyView

    def record_view(self, user_id: str, property_id: str) -> dict:
        doc = self.model(user_id=user_id, property_id=property_id)
        doc.save()
        return doc.to_dict()

    def get_recent_views(self, user_id: str, limit: int = 10) -> list[dict]:
        docs = self.model.active().filter(user_id=user_id).order_by('-viewed_at')[:limit]
        return [d.to_dict() for d in docs]
