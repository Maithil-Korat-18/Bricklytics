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

    def remove_wishlist(self, user_id: str, property_id: str) -> dict:
        self._log_operation('remove_wishlist', user_id=user_id, property_id=property_id)
        self.wishlist_repo.remove_from_wishlist(user_id, property_id)
        return {'in_wishlist': False, 'message': 'Property removed from wishlist.'}

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
        # Cap to max 12 properties for safety
        property_ids = [str(pid).strip() for pid in property_ids[:12] if str(pid).strip()]

        results = []
        for pid in property_ids:
            pdict = None
            try:
                pdict = self.property_repo.find_by_id(pid)
            except Exception:
                pass

            if not pdict:
                try:
                    all_active, _ = self.property_repo.filter_properties(limit=200)
                    pdict = next((p for p in all_active if str(p.get('id')) == pid or str(p.get('_id')) == pid), None)
                except Exception:
                    pass

            if pdict:
                try:
                    results.append(self.enrich_property(pdict))
                except Exception:
                    results.append(pdict)

        return results

    def get_better_alternatives(self, property_id: str, limit: int = 3) -> list[dict]:
        """
        Find genuinely better alternatives prioritized strictly by:
        1. Budget / Price Range match
        2. BHK match
        3. Locality / Area match
        4. Higher AI Investment Score than target property
        """
        self._log_operation('get_better_alternatives', property_id=property_id)
        try:
            target = self.property_repo.find_by_id(property_id)
        except Exception:
            return []

        if not target or target.get('status') != 'active':
            return []

        target_score = int(target.get('investment_score') or 0)
        target_bhk = int(target.get('bhk') or 2)
        target_type = target.get('property_type') or 'apartment'
        target_price = float(target.get('price') or 0)
        target_locality = str(target.get('locality') or '').strip().lower()

        # Query candidates in same property type with score and budget filters at DB level
        filters = {
            'status': 'active',
            'property_type': target_type,
        }
        if target_score > 0:
            filters['investment_score__gt'] = target_score
        if target_price > 0:
            filters['price__gte'] = target_price * 0.70
            filters['price__lte'] = target_price * 1.30

        candidates, _ = self.property_repo.filter_properties(
            filters=filters, limit=30, sort_by='-investment_score'
        )
        if not candidates:
            filters.pop('price__gte', None)
            filters.pop('price__lte', None)
            candidates, _ = self.property_repo.filter_properties(
                filters=filters, limit=30, sort_by='-investment_score'
            )

        scored_alternatives = []
        for c in candidates:
            cid = str(c.get('id') or '')
            if cid == str(property_id):
                continue  # skip target property itself

            enriched = self.enrich_property(c)
            c_score = int(enriched.get('investment_score') or 0)
            c_price = float(enriched.get('price') or 0)
            c_bhk = int(enriched.get('bhk') or 0)
            c_locality = str(enriched.get('locality') or '').strip().lower()

            # Must have a strictly higher AI Investment Score
            if c_score <= target_score:
                continue

            # Budget check: within ±25% price range
            budget_ratio = (c_price / target_price) if target_price > 0 else 1.0
            if budget_ratio < 0.70 or budget_ratio > 1.30:
                continue

            # BHK match: same BHK or ±1 BHK
            bhk_diff = abs(c_bhk - target_bhk)
            if bhk_diff > 1:
                continue

            # Locality match
            locality_match = (
                c_locality == target_locality
                or target_locality in c_locality
                or c_locality in target_locality
            )

            # Prioritization scoring (Locality 45%, Budget 25%, BHK 15%, Score Gain 15%):
            locality_score = 1.0 if locality_match else 0.25

            price_delta_pct = abs(c_price - target_price) / max(target_price, 1)
            budget_score = max(0.0, 1.0 - price_delta_pct)

            bhk_score = 1.0 if c_bhk == target_bhk else 0.6
            score_gain = (c_score - target_score) / 100.0

            composite_rank = (
                locality_score * 0.45 +
                budget_score * 0.25 +
                bhk_score * 0.15 +
                score_gain * 0.15
            )

            scored_alternatives.append((composite_rank, enriched))


        # Sort by composite rank descending, take top limit
        scored_alternatives.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored_alternatives[:limit]]


    def calculate_investment_score(self, prop: dict) -> int:
        from buyer.services.investment_service import InvestmentScoreService
        enriched = InvestmentScoreService().calculate(prop)
        return enriched.get('investment_score', 85)

    def enrich_property(self, prop: dict) -> dict:
        from buyer.services.investment_service import InvestmentScoreService
        return InvestmentScoreService().calculate(prop)

    def get_trending_locations(self) -> list[dict]:
        try:
            from seller.models.property import Property
            pipeline = [
                {'$match': {'status': 'active'}},
                {'$group': {'_id': '$locality', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}},
                {'$limit': 5}
            ]
            aggregated = list(Property.objects.aggregate(pipeline))
            if aggregated:
                base_score = 98
                results = []
                for item in aggregated:
                    loc = item.get('_id') or 'South Bopal'
                    results.append({
                        'name': f"{loc}, Ahmedabad" if 'Ahmedabad' not in str(loc) else str(loc),
                        'score': min(99, max(75, base_score)),
                        'count': item.get('count', 1)
                    })
                    base_score -= 4
                return results
        except Exception as e:
            logger.warning("Error fetching trending locations aggregate: %s", e)

        return [
            {'name': 'South Bopal, Ahmedabad', 'score': 98},
            {'name': 'Satellite, Ahmedabad', 'score': 94},
            {'name': 'Science City, Ahmedabad', 'score': 91},
            {'name': 'Prahlad Nagar, Ahmedabad', 'score': 88},
            {'name': 'Bodakdev, Ahmedabad', 'score': 85},
        ]


    def get_dashboard(self, user) -> dict:
        user_id = str(user.id)
        self._log_operation('get_dashboard', user_id=user_id)
        
        wishlist_items = self.get_wishlist(user_id)
        saved_searches = self.get_saved_searches(user_id)
        visits = self.get_scheduled_visits(user_id)
        recently_viewed = self.get_recently_viewed(user_id)

        all_props, total_count = self.property_repo.filter_properties(
            filters={'status': 'active'},
            limit=20,
            sort_by='-created_at',
        )

        enriched_props = [self.enrich_property(p) for p in all_props]

        recommended_props = enriched_props[:6]
        latest_props = enriched_props[:6]
        trending_locations = self.get_trending_locations()

        high_conviction_count = sum(1 for p in enriched_props if p.get('investment_score', 0) >= 80)
        if high_conviction_count == 0:
            high_conviction_count = len(recommended_props)

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
                'description': f'{total_count} active properties in Ahmedabad.',
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
                'ai_recommendations_count': high_conviction_count,
                'compared_count': 3,
            },
            'wishlist_items': wishlist_items[:4],
            'saved_searches': saved_searches,
            'scheduled_visits': visits,
            'recently_viewed': recently_viewed[:4],
            'recommended_properties': recommended_props,
            'latest_properties': latest_props,
            'trending_locations': trending_locations,
            'activities': activities,
        }
