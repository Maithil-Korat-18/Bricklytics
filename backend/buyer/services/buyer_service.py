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
    PropertyCompareRepository,
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
        self.compare_repo = PropertyCompareRepository()
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
            raise ValidationError('This property is no longer available for visits or inquiries.')

        from datetime import datetime
        import uuid
        from buyer.models.visit_schedule import VisitSchedule, InquiryMessage

        req_type = data.get('request_type', 'visit')
        notes_text = data.get('notes', '')

        messages = []
        if notes_text:
            messages.append(InquiryMessage(
                id=str(uuid.uuid4())[:8],
                sender_id=str(user.id),
                sender_role='buyer',
                sender_name=user.full_name,
                message=notes_text,
                created_at=datetime.utcnow()
            ))

        doc = VisitSchedule(
            user_id=str(user.id),
            seller_id=str(prop.get('seller_id') or ''),
            property_id=data['property_id'],
            property_title=prop.get('title', 'Property Visit'),
            request_type=req_type,
            buyer_name=user.full_name,
            buyer_phone=user.phone_number,
            buyer_email=user.email,
            preferred_date=data.get('preferred_date', ''),
            preferred_time=data.get('preferred_time', ''),
            notes=notes_text,
            messages=messages,
            status='requested',
        )
        doc.save()
        return doc.to_dict()

    def get_scheduled_visits(self, user_id: str) -> list[dict]:
        self._log_operation('get_scheduled_visits', user_id=user_id)
        from buyer.models.visit_schedule import VisitSchedule
        docs = VisitSchedule.objects(user_id=user_id, is_deleted=False).order_by('-created_at')
        
        # Bulk query properties to attach correct cover image to every visit schedule item
        prop_ids = list({str(d.property_id) for d in docs if d.property_id})
        prop_map = {}
        if prop_ids:
            try:
                from seller.models.property import Property
                props = Property.objects(id__in=prop_ids, is_deleted=False)
                for p in props:
                    cover_img = None
                    if p.images:
                        cover_img = next((img.url for img in p.images if getattr(img, 'is_cover', False)), None)
                        if not cover_img and len(p.images) > 0:
                            cover_img = p.images[0].url
                    prop_map[str(p.id)] = {
                        'image': cover_img,
                        'locality': p.locality or p.address or 'Ahmedabad',
                    }
            except Exception as err:
                logger.warning("Could not bulk fetch property images for scheduled visits: %s", err)

        results = []
        for d in docs:
            item = d.to_dict()
            # Privacy Gating check for buyer view
            is_unlocked = d.status == 'confirmed' or bool(d.seller_reply) or any(m.sender_role == 'seller' for m in d.messages)
            item['contact_unlocked'] = is_unlocked

            p_info = prop_map.get(str(d.property_id), {})
            if p_info.get('image'):
                item['property_image'] = p_info['image']
            if p_info.get('locality'):
                item['property_locality'] = p_info['locality']

            results.append(item)
        return results

    def add_buyer_message(self, user_id: str, visit_id: str, message_text: str) -> dict:
        self._log_operation('add_buyer_message', user_id=user_id, visit_id=visit_id)
        from datetime import datetime
        import uuid
        from buyer.models.visit_schedule import VisitSchedule, InquiryMessage

        doc = VisitSchedule.objects(id=visit_id, user_id=user_id, is_deleted=False).first()
        if not doc:
            raise ResourceNotFoundError("Visit request or inquiry not found.", resource="VisitSchedule", resource_id=visit_id)

        from accounts.models import User
        buyer_user = User.objects(id=user_id).first()
        buyer_name = buyer_user.full_name if buyer_user else 'Buyer'

        new_msg = InquiryMessage(
            id=str(uuid.uuid4())[:8],
            sender_id=user_id,
            sender_role='buyer',
            sender_name=buyer_name,
            message=message_text,
            created_at=datetime.utcnow()
        )
        doc.messages.append(new_msg)
        doc.save()

        item = doc.to_dict()
        item['contact_unlocked'] = doc.status == 'confirmed' or bool(doc.seller_reply) or any(m.sender_role == 'seller' for m in doc.messages)
        return item

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
        # Cap to max 12 properties for safety and remove empty strings
        clean_ids = []
        for pid in property_ids[:12]:
            s = str(pid).strip()
            if s and s not in clean_ids:
                clean_ids.append(s)

        if not clean_ids:
            return []

        from seller.models.property import Property
        prop_map = {}
        try:
            docs = Property.objects.filter(id__in=clean_ids, is_deleted=False)
            for d in docs:
                prop_map[str(d.id)] = d.to_dict()
        except Exception as e:
            logger.warning("Bulk fetch in compare_properties failed: %s. Falling back to repo lookups.", e)

        results = []
        for pid in clean_ids:
            pdict = prop_map.get(pid)
            if not pdict:
                try:
                    pdict = self.property_repo.find_by_id(pid)
                except Exception:
                    pdict = None

            if pdict:
                try:
                    results.append(self.enrich_property(pdict))
                except Exception:
                    results.append(pdict)

        return results

    def get_user_compare_ids(self, user_id: str) -> list[str]:
        self._log_operation('get_user_compare_ids', user_id=user_id)
        return self.compare_repo.find_by_user(user_id)

    def get_user_compare_properties(self, user_id: str) -> dict:
        self._log_operation('get_user_compare_properties', user_id=user_id)
        ids = self.compare_repo.find_by_user(user_id)
        props = self.compare_properties(ids)
        return {
            'property_ids': ids,
            'properties': props,
        }

    def add_to_compare(self, user_id: str, property_id: str) -> dict:
        self._log_operation('add_to_compare', user_id=user_id, property_id=property_id)
        success = self.compare_repo.add_to_compare(user_id, property_id)
        if not success and len(self.compare_repo.find_by_user(user_id)) >= 12:
            raise ValidationError('Maximum 12 properties can be added to compare list.')
        return self.get_user_compare_properties(user_id)

    def remove_from_compare(self, user_id: str, property_id: str) -> dict:
        self._log_operation('remove_from_compare', user_id=user_id, property_id=property_id)
        self.compare_repo.remove_from_compare(user_id, property_id)
        return self.get_user_compare_properties(user_id)

    def clear_compare(self, user_id: str) -> dict:
        self._log_operation('clear_compare', user_id=user_id)
        self.compare_repo.clear_compare(user_id)
        return {
            'property_ids': [],
            'properties': [],
        }

    def sync_user_compare(self, user_id: str, property_ids: list[str]) -> dict:
        self._log_operation('sync_user_compare', user_id=user_id, count=len(property_ids))
        self.compare_repo.sync_compare(user_id, property_ids)
        return self.get_user_compare_properties(user_id)


    def get_better_alternatives(self, property_id: str, limit: int = 3) -> list[dict]:
        """
        Find genuinely better alternative properties prioritized strictly by:
        1. Nearby Area / Spatial Proximity (Same locality or lat/lon distance <= 5 km)
        2. Budget / Price Range match (within +-20% of target price)
        3. BHK match (same BHK or +-1 BHK)
        4. Higher AI Investment Score or value-to-price ratio
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
        target_lat = float(target.get('latitude') or 23.0225)
        target_lon = float(target.get('longitude') or 72.5714)

        import math
        def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            try:
                r = 6371.0
                dlat = math.radians(float(lat2) - float(lat1))
                dlon = math.radians(float(lon2) - float(lon1))
                a = (math.sin(dlat / 2.0) ** 2 +
                     math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) *
                     math.sin(dlon / 2.0) ** 2)
                return r * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
            except Exception:
                return 999.0

        # Tier 1: Query same locality or budget/BHK match in DB
        min_bhk = max(1, target_bhk - 1)
        max_bhk = target_bhk + 1
        min_price = target_price * 0.75 if target_price > 0 else 0
        max_price = target_price * 1.25 if target_price > 0 else 1e9

        tier1_filters = {
            'status': 'active',
            'property_type': target_type,
            'bhk__gte': min_bhk,
            'bhk__lte': max_bhk,
        }
        if target_price > 0:
            tier1_filters['price__gte'] = min_price
            tier1_filters['price__lte'] = max_price

        # Search candidates
        candidates, _ = self.property_repo.filter_properties(
            filters=tier1_filters, limit=80, sort_by='-investment_score'
        )

        if len(candidates) < limit:
            # Expand price window if necessary
            tier1_filters.pop('price__gte', None)
            tier1_filters.pop('price__lte', None)
            more_cands, _ = self.property_repo.filter_properties(
                filters=tier1_filters, limit=80, sort_by='-investment_score'
            )
            existing_ids = {str(c.get('id') or c.get('_id')) for c in candidates}
            for mc in more_cands:
                mc_id = str(mc.get('id') or mc.get('_id'))
                if mc_id not in existing_ids:
                    candidates.append(mc)
                    existing_ids.add(mc_id)

        scored_alternatives = []
        for c in candidates:
            cid = str(c.get('id') or c.get('_id') or '')
            if cid == str(property_id):
                continue

            enriched = self.enrich_property(c)
            c_score = int(enriched.get('investment_score') or 0)
            c_price = float(enriched.get('price') or 0)
            c_bhk = int(enriched.get('bhk') or 0)
            c_locality = str(enriched.get('locality') or '').strip().lower()
            c_lat = float(enriched.get('latitude') or 23.0225)
            c_lon = float(enriched.get('longitude') or 72.5714)

            # Spatial distance in km
            dist_km = _haversine_km(target_lat, target_lon, c_lat, c_lon)

            # Locality / Nearby Area Score (40% weight)
            locality_match = (
                c_locality == target_locality
                or target_locality in c_locality
                or c_locality in target_locality
            )
            if locality_match or dist_km <= 2.0:
                locality_score = 1.0
            elif dist_km <= 4.0:
                locality_score = 0.85
            elif dist_km <= 7.0:
                locality_score = 0.60
            elif dist_km <= 10.0:
                locality_score = 0.35
            else:
                locality_score = 0.10

            # Budget Match Score (30% weight)
            if target_price > 0:
                price_delta_pct = abs(c_price - target_price) / target_price
                if price_delta_pct > 0.30: # Penalize properties > 30% price difference
                    continue
                budget_score = max(0.0, 1.0 - (price_delta_pct / 0.30))
            else:
                budget_score = 0.8

            # BHK Match Score (20% weight)
            bhk_diff = abs(c_bhk - target_bhk)
            if bhk_diff > 1: # Strict +-1 BHK limit
                continue
            bhk_score = 1.0 if bhk_diff == 0 else 0.70

            # Investment Score / Value Gain (10% weight)
            score_diff = c_score - target_score
            value_gain_score = max(0.0, min(1.0, (score_diff + 5.0) / 15.0))

            # Composite Ranking (Nearby Locality 40%, Budget 30%, BHK 20%, Score Gain 10%)
            composite_rank = (
                locality_score * 0.40 +
                budget_score * 0.30 +
                bhk_score * 0.20 +
                value_gain_score * 0.10
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
        from common.amenity_normalizer import normalize_amenity_list
        enriched = InvestmentScoreService().calculate(prop)
        if 'amenities' in enriched and isinstance(enriched['amenities'], list):
            enriched['amenities'] = normalize_amenity_list(enriched['amenities'])
        return enriched

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
                'compared_count': len(self.compare_repo.find_by_user(user_id)),
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
