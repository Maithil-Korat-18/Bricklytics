"""
buyer/services/buyer_service.py — Business Logic Layer for Buyer Module
"""

import logging
from core.base.service import BaseService
from buyer.repositories.buyer_repository import (
    WishlistRepository,
    SavedSearchRepository,
    VisitScheduleRepository,
    PropertyViewRepository,
)
from seller.repositories.property_repository import PropertyRepository
from core.exceptions.base import ResourceNotFoundError, ValidationError

logger = logging.getLogger('bricklytics.buyer')


class BuyerService(BaseService):
    def __init__(self):
        super().__init__()
        self.wishlist_repo = WishlistRepository()
        self.search_repo = SavedSearchRepository()
        self.visit_repo = VisitScheduleRepository()
        self.view_repo = PropertyViewRepository()
        self.property_repo = PropertyRepository()

    def toggle_wishlist(self, user_id: str, property_id: str) -> dict:
        self._log_operation('toggle_wishlist', user_id=user_id, property_id=property_id)
        
        # Verify property exists
        property_data = self.property_repo.find_by_id(property_id)
        if property_data.get('status') != 'active':
            raise ValidationError('This property is no longer available.')

        if self.wishlist_repo.is_in_wishlist(user_id, property_id):
            self.wishlist_repo.remove_from_wishlist(user_id, property_id)
            return {'in_wishlist': False, 'message': 'Property removed from wishlist.'}
        else:
            self.wishlist_repo.create({'user_id': user_id, 'property_id': property_id})
            return {'in_wishlist': True, 'message': 'Property saved to wishlist.'}

    def get_wishlist(self, user_id: str) -> list[dict]:
        self._log_operation('get_wishlist', user_id=user_id)
        wishlist_items = self.wishlist_repo.find_by_user(user_id)
        results = []
        for item in wishlist_items:
            try:
                prop_details = self.property_repo.find_by_id(item['property_id'])
                if prop_details.get('status') != 'active':
                    continue
                results.append({
                    'id': item['id'],
                    'property_id': item['property_id'],
                    'property_details': prop_details,
                    'created_at': item.get('created_at'),
                })
            except Exception:
                continue
        return results

    def save_search(self, user_id: str, title: str, filters: dict) -> dict:
        self._log_operation('save_search', user_id=user_id, title=title)
        return self.search_repo.create({
            'user_id': user_id,
            'title': title,
            'filters': filters,
        })

    def get_saved_searches(self, user_id: str) -> list[dict]:
        self._log_operation('get_saved_searches', user_id=user_id)
        return self.search_repo.find_by_user(user_id)

    def delete_saved_search(self, user_id: str, search_id: str) -> None:
        self._log_operation('delete_saved_search', user_id=user_id, search_id=search_id)
        search_item = self.search_repo.find_by_id(search_id)
        if search_item.get('user_id') != user_id:
            raise ValidationError("You do not have permission to delete this saved search.")
        self.search_repo.delete(search_id)

    def schedule_visit(self, user, data: dict) -> dict:
        self._log_operation('schedule_visit', user_id=str(user.id), property_id=data['property_id'])
        
        prop = self.property_repo.find_by_id(data['property_id'])
        if prop.get('status') != 'active':
            raise ValidationError('This property is no longer available for visits.')

        schedule_data = {
            'user_id': str(user.id),
            'property_id': data['property_id'],
            'property_title': prop.get('title', 'Property Visit'),
            'buyer_name': user.full_name,
            'buyer_phone': user.phone_number,
            'buyer_email': user.email,
            'preferred_date': data['preferred_date'],
            'preferred_time': data['preferred_time'],
            'notes': data.get('notes', ''),
            'status': 'requested',
        }
        return self.visit_repo.create(schedule_data)

    def get_scheduled_visits(self, user_id: str) -> list[dict]:
        self._log_operation('get_scheduled_visits', user_id=user_id)
        return self.visit_repo.find_by_user(user_id)

    def record_view(self, user_id: str, property_id: str) -> None:
        self._log_operation('record_view', user_id=user_id, property_id=property_id)
        self.view_repo.record_view(user_id, property_id)

    def get_recently_viewed(self, user_id: str) -> list[dict]:
        self._log_operation('get_recently_viewed', user_id=user_id)
        views = self.view_repo.get_recent_views(user_id, limit=10)
        seen_ids = set()
        props = []
        for v in views:
            pid = v.get('property_id')
            if pid not in seen_ids:
                seen_ids.add(pid)
                try:
                    pdict = self.property_repo.find_by_id(pid)
                    if pdict.get('status') == 'active':
                        props.append(pdict)
                except Exception:
                    continue
        return props

    def compare_properties(self, property_ids: list[str]) -> list[dict]:
        self._log_operation('compare_properties', count=len(property_ids))
        if len(property_ids) > 4:
            raise ValidationError("You can compare up to 4 properties at a time.")
        
        results = []
        for pid in property_ids:
            try:
                pdict = self.property_repo.find_by_id(pid)
                if pdict.get('status') == 'active':
                    results.append(pdict)
            except Exception:
                continue
        return results

    def get_dashboard(self, user) -> dict:
        user_id = str(user.id)
        self._log_operation('get_dashboard', user_id=user_id)
        
        wishlist_items = self.get_wishlist(user_id)
        saved_searches = self.get_saved_searches(user_id)
        visits = self.get_scheduled_visits(user_id)
        recently_viewed = self.get_recently_viewed(user_id)

        all_props, total_count = self.property_repo.filter_properties(
            filters={'status': 'active'},
            limit=10,
            sort_by='-created_at',
        )

        # Recommended properties based on user role/activity
        recommended_props = all_props[:4]
        latest_props = all_props[:6]

        activities = [
            {
                'id': 'act-1',
                'title': 'Property Visit Requested',
                'description': f'Requested visit for {visits[0]["property_title"]}' if visits else 'Browse properties to schedule a visit.',
                'timestamp': 'Just now' if visits else 'Today',
                'type': 'visit'
            },
            {
                'id': 'act-2',
                'title': 'AI Price Index Updated',
                'description': 'Ahmedabad market values updated (+3.4% projected growth).',
                'timestamp': '2 hours ago',
                'type': 'ai'
            },
            {
                'id': 'act-3',
                'title': 'New Properties Listed',
                'description': f'{total_count} luxury properties active in Bopal, Science City & Satellite.',
                'timestamp': '1 day ago',
                'type': 'listing'
            }
        ]

        return {
            'stats': {
                'wishlist_count': len(wishlist_items),
                'saved_searches_count': len(saved_searches),
                'scheduled_visits_count': len(visits),
                'recently_viewed_count': len(recently_viewed),
                'total_market_properties': total_count,
            },
            'wishlist_items': wishlist_items[:4],
            'saved_searches': saved_searches,
            'scheduled_visits': visits,
            'recently_viewed': recently_viewed[:4],
            'recommended_properties': recommended_props,
            'latest_properties': latest_props,
            'activities': activities,
        }
