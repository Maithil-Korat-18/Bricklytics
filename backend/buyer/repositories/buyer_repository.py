"""
buyer/repositories/buyer_repository.py — Data Access for Buyer Collections
"""

from core.base.repository import BaseRepository
from buyer.models.wishlist import Wishlist
from buyer.models.visit_schedule import VisitSchedule
from buyer.models.property_view import PropertyView
from buyer.models.property_compare import PropertyCompare


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


class PropertyCompareRepository(BaseRepository):
    model = PropertyCompare

    def find_by_user(self, user_id: str) -> list[str]:
        docs = self.model.active().filter(user_id=user_id).order_by('created_at')
        return [d.property_id for d in docs]

    def is_in_compare(self, user_id: str, property_id: str) -> bool:
        pid = str(property_id).strip()
        return self.model.active().filter(user_id=user_id, property_id=pid).count() > 0

    def add_to_compare(self, user_id: str, property_id: str) -> bool:
        pid = str(property_id).strip()
        if not pid:
            return False
        if not self.is_in_compare(user_id, pid):
            count = self.model.active().filter(user_id=user_id).count()
            if count >= 12:
                return False
            doc = self.model(user_id=user_id, property_id=pid)
            doc.save()
        return True

    def remove_from_compare(self, user_id: str, property_id: str) -> bool:
        pid = str(property_id).strip()
        items = self.model.active().filter(user_id=user_id, property_id=pid)
        for item in items:
            item.soft_delete()
        return True

    def clear_compare(self, user_id: str) -> bool:
        items = self.model.active().filter(user_id=user_id)
        for item in items:
            item.soft_delete()
        return True

    def sync_compare(self, user_id: str, property_ids: list[str]) -> list[str]:
        current_items = self.model.active().filter(user_id=user_id)
        for item in current_items:
            item.soft_delete()
        
        clean_ids = []
        for pid in property_ids[:12]:
            pid_str = str(pid).strip()
            if pid_str and pid_str not in clean_ids:
                clean_ids.append(pid_str)
                doc = self.model(user_id=user_id, property_id=pid_str)
                doc.save()
        return clean_ids

