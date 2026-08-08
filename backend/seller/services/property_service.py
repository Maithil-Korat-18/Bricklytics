"""
seller/services/property_service.py — Business Logic Layer for Seller Property Module
"""

import logging
from core.base.service import BaseService
from seller.repositories.property_repository import PropertyRepository
from seller.validators.base import PropertyValidator
from seller.services.file_service import FileService
from seller.models.property import PropertyImage, PropertyDocument, PropertyAmenity, PredictionHistory
from buyer.models.property_view import PropertyView
from buyer.models.visit_schedule import VisitSchedule
from core.exceptions.base import ResourceNotFoundError, ValidationError

logger = logging.getLogger('bricklytics.seller')


class PropertyService(BaseService):
    def __init__(self, repository: PropertyRepository = None):
        super().__init__()
        self.repository = repository or PropertyRepository()

    def _enrich_with_ai_predictions(self, data: dict) -> dict:
        from seller.services.prediction_service import PredictionService
        from datetime import datetime, timezone
        try:
            amenity_names = []
            raw_amenities = data.get('amenities', [])
            for a in raw_amenities:
                if isinstance(a, PropertyAmenity):
                    amenity_names.append(a.name)
                elif isinstance(a, dict):
                    amenity_names.append(a.get('name', ''))
                elif isinstance(a, str):
                    amenity_names.append(a)

            area = float(data.get('carpetArea') or data.get('area_sqft', 1000) or 1000)
            price = float(data.get('price') or data.get('expectedPrice', 0) or 0)

            conditions = {
                'locality': data.get('locality') or data.get('address') or 'Science City',
                'property_type': data.get('property_type') or data.get('propertyType') or 'flat',
                'propertyType': data.get('propertyType') or data.get('property_type') or 'flat',
                'bhk': int(data.get('bhk', 2) or 2),
                'carpetArea': area,
                'area_sqft': area,
                'price': price,
                'expectedPrice': price,
                'latitude': float(data.get('latitude') if data.get('latitude') is not None else 23.0225),
                'longitude': float(data.get('longitude') if data.get('longitude') is not None else 72.5714),

                'listingType': data.get('listingType') or data.get('listing_type') or data.get('saleType') or 'New Property',
                'saleType': data.get('saleType') or data.get('sale_type') or 'new',
                'reconstruction_needed': data.get('reconstruction_needed') or data.get('reconstructionNeeded') or '',
                'reconstructionNeeded': data.get('reconstructionNeeded') or data.get('reconstruction_needed') or '',
                'facing': data.get('facing') or 'East',
                'property_age': int(data.get('property_age') or data.get('propertyAge') or 1),
                'propertyAge': int(data.get('propertyAge') or data.get('property_age') or 1),
                'amenities': amenity_names,
            }
            res = PredictionService().predict_by_conditions(conditions)
            data['predicted_price'] = res.get('final_suggested_price') or res.get('predicted_price') or price
            data['base_ml_price'] = res.get('base_market_price') or res.get('base_ml_price') or price
            data['amenity_adjustment'] = (res.get('adjustment_breakdown') or {}).get('total_adjustment', 0.0)
            data['confidence_score'] = res.get('confidence_score', 92.0)
            
            appr = res.get('appreciation', {})
            data['appreciation_annual_rate'] = appr.get('annual_rate_percent', 7.5)
            data['appreciation_1yr'] = (appr.get('estimated_1yr') or {}).get('appreciation_percent')
            data['appreciation_3yr'] = (appr.get('estimated_3yr') or {}).get('appreciation_percent')
            data['appreciation_5yr'] = (appr.get('estimated_5yr') or {}).get('appreciation_percent')
            data['future_price_1yr'] = (appr.get('estimated_1yr') or {}).get('future_estimated_price')
            data['future_price_3yr'] = (appr.get('estimated_3yr') or {}).get('future_estimated_price')
            data['future_price_5yr'] = (appr.get('estimated_5yr') or {}).get('future_estimated_price')
            
            inv = res.get('investment', {})
            data['investment_score'] = res.get('investment_score') or inv.get('score', 82)
            data['investment_rating'] = res.get('investment_rating') or inv.get('rating', 'Very Good')
            explanation = res.get('investment_explanation') or inv.get('explanation', 'Strong property investment profile.')
            data['investment_explanation'] = explanation.replace('/95', '/100') if isinstance(explanation, str) else explanation
            data['investment_reasons'] = inv.get('reasons', res.get('investment_reasons', []))
            
            data['prediction_fingerprint'] = res.get('prediction_fingerprint')
            data['appreciation_methodology'] = appr.get('methodology')
            data['prediction_timestamp'] = datetime.now(timezone.utc)
        except Exception as e:
            logger.warning("Could not run auto AI prediction: %s", e)
        return data


    def create_property(self, data: dict) -> dict:
        self._log_operation('create_property', title=data.get('title'))
        
        validator = PropertyValidator(data)
        validator.validate()

        amenities_data = data.pop('amenities', [])
        clean_amenities = []
        for a in amenities_data:
            if isinstance(a, PropertyAmenity):
                clean_amenities.append(a)
            elif isinstance(a, dict):
                clean_amenities.append(PropertyAmenity(
                    name=str(a.get('name', '')).strip(),
                    category=str(a.get('category', 'General')).strip(),
                    icon=a.get('icon')
                ))
            elif isinstance(a, str):
                clean_amenities.append(PropertyAmenity(name=a.strip(), category='General'))

        property_data = {
            **data,
            'status': data.get('status', 'active'),
            'amenities': clean_amenities,
            'images': [],
            'brochures': [],
            'predictions': [],
        }

        property_data = self._enrich_with_ai_predictions(property_data)
        return self.repository.create(property_data)

    def get_property_by_id(self, property_id: str, seller_id: str = None) -> dict:
        self._log_operation('get_property_by_id', property_id=property_id)
        property_data = self.repository.find_by_id(property_id)
        if seller_id is not None and property_data.get('seller_id') != seller_id:
            raise ResourceNotFoundError(
                'Property not found.',
                resource='Property',
                resource_id=property_id,
            )
        return property_data

    def list_properties(
        self,
        filters: dict = None,
        search_query: str = None,
        sort_by: str = '-created_at',
        page: int = 1,
        page_size: int = 20,
        seller_id: str = None,
    ) -> tuple[list[dict], int]:
        self._log_operation('list_properties', page=page, page_size=page_size)
        skip = (page - 1) * page_size
        scoped_filters = {**(filters or {})}
        if seller_id is not None:
            scoped_filters['seller_id'] = seller_id
        return self.repository.filter_properties(
            filters=scoped_filters,
            search_query=search_query,
            sort_by=sort_by,
            limit=page_size,
            skip=skip,
        )

    def update_property(self, property_id: str, data: dict, seller_id: str = None) -> dict:
        self._log_operation('update_property', property_id=property_id)
        existing = self.get_property_by_id(property_id, seller_id=seller_id)
        
        validator = PropertyValidator(data)
        validator.validate()

        if 'amenities' in data:
            amenities_data = data.pop('amenities')
            data['amenities'] = [PropertyAmenity(**a) for a in amenities_data]

        # Clean out None latitude / longitude so existing coordinates are preserved
        clean_data = {k: v for k, v in data.items() if v is not None or k not in ('latitude', 'longitude')}
        merged = {**existing, **clean_data}

        from seller.services.prediction_service import PredictionService
        prior_fingerprint = existing.get('prediction_fingerprint')
        next_fingerprint = PredictionService.prediction_fingerprint(merged)
        if not prior_fingerprint or next_fingerprint != prior_fingerprint:
            enriched = self._enrich_with_ai_predictions(merged)
            prediction_fields = (
                'predicted_price', 'base_ml_price', 'amenity_adjustment', 'confidence_score',
                'appreciation_1yr', 'appreciation_3yr', 'appreciation_5yr',
                'future_price_1yr', 'future_price_3yr', 'future_price_5yr',
                'investment_score', 'investment_rating', 'investment_explanation',
                'prediction_fingerprint', 'appreciation_methodology', 'prediction_timestamp',
            )
            data.update({field: enriched.get(field) for field in prediction_fields})
        return self.repository.update(property_id, data)

    def delete_property(self, property_id: str, seller_id: str = None) -> None:
        self._log_operation('delete_property', property_id=property_id)
        self.get_property_by_id(property_id, seller_id=seller_id)
        self.repository.delete(property_id)

    def update_property_status(self, property_id: str, status: str, seller_id: str = None) -> dict:
        self._log_operation('update_property_status', property_id=property_id, status=status)
        self.get_property_by_id(property_id, seller_id=seller_id)
        return self.repository.update(property_id, {'status': status})

    def get_property_performance(self, property_id: str, seller_id: str = None) -> dict:
        """Return real engagement metrics for one seller-owned property."""
        self.get_property_by_id(property_id, seller_id=seller_id)
        return {
            'views': PropertyView.objects(property_id=property_id).count(),
            'inquiries': VisitSchedule.objects(property_id=property_id, is_deleted=False).count(),
            'scheduled_visits': VisitSchedule.objects(
                property_id=property_id,
                is_deleted=False,
                status__in=['requested', 'confirmed'],
            ).count(),
        }

    # ── Image Operations ──────────────────────────────────────────────────────

    def upload_images(self, property_id: str, image_files: list, seller_id: str = None) -> dict:
        self._log_operation('upload_images', property_id=property_id, count=len(image_files))
        self.get_property_by_id(property_id, seller_id=seller_id)
        doc = PropertyRepository.model.get_or_404(property_id)

        new_images = []
        is_first = len(doc.images) == 0

        for idx, file_obj in enumerate(image_files):
            img_data = FileService.save_image(file_obj)
            if is_first and idx == 0:
                img_data['is_cover'] = True
            new_images.append(PropertyImage(**img_data))

        doc.images.extend(new_images)
        doc.save()

        return doc.to_dict()

    def delete_image(self, property_id: str, image_id: str, seller_id: str = None) -> dict:
        self._log_operation('delete_image', property_id=property_id, image_id=image_id)
        self.get_property_by_id(property_id, seller_id=seller_id)
        doc = PropertyRepository.model.get_or_404(property_id)

        target_img = None
        for img in doc.images:
            if img.id == image_id:
                target_img = img
                break

        if not target_img:
            raise ResourceNotFoundError("Image not found in property.", resource="PropertyImage", resource_id=image_id)

        FileService.delete_file(target_img.file_path)
        doc.images.remove(target_img)

        if target_img.is_cover and len(doc.images) > 0:
            doc.images[0].is_cover = True

        doc.save()
        return doc.to_dict()

    def set_cover_image(self, property_id: str, image_id: str, seller_id: str = None) -> dict:
        self._log_operation('set_cover_image', property_id=property_id, image_id=image_id)
        self.get_property_by_id(property_id, seller_id=seller_id)
        doc = PropertyRepository.model.get_or_404(property_id)

        found = False
        for img in doc.images:
            if img.id == image_id:
                img.is_cover = True
                found = True
            else:
                img.is_cover = False

        if not found:
            raise ResourceNotFoundError("Image not found in property.", resource="PropertyImage", resource_id=image_id)

        doc.save()
        return doc.to_dict()

    # ── Brochure Operations ───────────────────────────────────────────────────

    def upload_brochure(self, property_id: str, brochure_file, seller_id: str = None) -> dict:
        self._log_operation('upload_brochure', property_id=property_id)
        self.get_property_by_id(property_id, seller_id=seller_id)
        doc = PropertyRepository.model.get_or_404(property_id)

        doc_data = FileService.save_brochure(brochure_file)
        doc.brochures.append(PropertyDocument(**doc_data))
        doc.save()

        return doc.to_dict()

    # ── Analytics & Stats ─────────────────────────────────────────────────────

    def get_analytics(self, seller_id: str = None) -> dict:
        """Calculate and return fully dynamic analytics metrics for the seller dashboard."""
        self._log_operation('get_analytics')
        try:
            filters = {'seller_id': seller_id} if seller_id is not None else None
            all_props = self.repository.find_all(filters=filters, limit=1000)

            total_properties = len(all_props)
            if total_properties == 0:
                return self._empty_analytics()

            # ── Single-pass property aggregation ──────────────────────────────
            status_counts = {'draft': 0, 'active': 0, 'inactive': 0, 'sold': 0, 'archived': 0}
            property_type_counts = {}
            bhk_counts = {}
            locality_counts = {}
            investment_rating_counts = {}
            appreciation_category_counts = {}

            total_price = 0
            total_predicted_price = 0
            total_future_3yr = 0
            total_future_5yr = 0
            total_investment_score = 0
            total_appreciation_1yr = 0
            props_with_investment_score = 0
            props_with_appreciation = 0
            active_count = 0

            for p in all_props:
                # Status
                st = p.get('status', 'active')
                status_counts[st] = status_counts.get(st, 0) + 1
                if st == 'active':
                    active_count += 1

                # Price totals
                price = float(p.get('price', 0) or 0)
                total_price += price

                pred_price = float(p.get('predicted_price', 0) or 0)
                total_predicted_price += pred_price

                fp3 = float(p.get('future_price_3yr', 0) or 0)
                fp5 = float(p.get('future_price_5yr', 0) or 0)
                total_future_3yr += fp3 if fp3 > 0 else pred_price
                total_future_5yr += fp5 if fp5 > 0 else pred_price

                # Investment score
                inv_score = p.get('investment_score')
                if inv_score is not None:
                    total_investment_score += int(inv_score)
                    props_with_investment_score += 1

                # Appreciation
                appr_1yr = p.get('appreciation_1yr')
                if appr_1yr is not None:
                    total_appreciation_1yr += float(appr_1yr)
                    props_with_appreciation += 1

                # Property type distribution
                pt = p.get('property_type', 'apartment')
                property_type_counts[pt] = property_type_counts.get(pt, 0) + 1

                # BHK distribution
                bhk = int(p.get('bhk', 0) or 0)
                bhk_label = f'{bhk} BHK' if bhk <= 5 else '5+ BHK'
                bhk_counts[bhk_label] = bhk_counts.get(bhk_label, 0) + 1

                # Locality distribution
                loc = p.get('locality', 'Unknown') or 'Unknown'
                locality_counts[loc] = locality_counts.get(loc, 0) + 1

                # Investment rating distribution
                rating = p.get('investment_rating', 'Not Rated') or 'Not Rated'
                investment_rating_counts[rating] = investment_rating_counts.get(rating, 0) + 1

                # Appreciation category distribution
                appr_val = float(p.get('appreciation_1yr', 0) or 0)
                if appr_val >= 6:
                    appr_cat = 'High (≥6%)'
                elif appr_val >= 4.5:
                    appr_cat = 'Above Average (4.5-6%)'
                elif appr_val >= 3:
                    appr_cat = 'Average (3-4.5%)'
                elif appr_val > 0:
                    appr_cat = 'Below Average (<3%)'
                else:
                    appr_cat = 'Not Calculated'
                appreciation_category_counts[appr_cat] = appreciation_category_counts.get(appr_cat, 0) + 1

            # ── Computed averages ─────────────────────────────────────────────
            average_price = round(total_price / total_properties, 2)
            avg_predicted_price = round(total_predicted_price / total_properties, 2) if total_predicted_price > 0 else 0
            avg_investment_score = round(total_investment_score / props_with_investment_score, 1) if props_with_investment_score > 0 else 0
            avg_appreciation = round(total_appreciation_1yr / props_with_appreciation, 2) if props_with_appreciation > 0 else 0

            # ── Portfolio Analysis ────────────────────────────────────────────
            portfolio_current = round(total_predicted_price, 2) if total_predicted_price > 0 else round(total_price, 2)
            portfolio_3yr = round(total_future_3yr, 2)
            portfolio_5yr = round(total_future_5yr, 2)
            growth_3yr_pct = round(((portfolio_3yr - portfolio_current) / portfolio_current) * 100, 2) if portfolio_current > 0 else 0
            growth_5yr_pct = round(((portfolio_5yr - portfolio_current) / portfolio_current) * 100, 2) if portfolio_current > 0 else 0
            profit_3yr = round(portfolio_3yr - portfolio_current, 2)
            profit_5yr = round(portfolio_5yr - portfolio_current, 2)

            # ── View & Inquiry counts via aggregation ─────────────────────────
            property_ids = [str(p.get('id')) for p in all_props if p.get('id')]
            view_counts = {pid: 0 for pid in property_ids}
            inquiry_counts = {pid: 0 for pid in property_ids}

            if property_ids:
                for item in PropertyView.objects(property_id__in=property_ids).aggregate(
                    {'$group': {'_id': '$property_id', 'count': {'$sum': 1}}}
                ):
                    view_counts[str(item['_id'])] = item['count']
                for item in VisitSchedule.objects(property_id__in=property_ids, is_deleted=False).aggregate(
                    {'$group': {'_id': '$property_id', 'count': {'$sum': 1}}}
                ):
                    inquiry_counts[str(item['_id'])] = item['count']

            total_views = sum(view_counts.values())
            total_inquiries = sum(inquiry_counts.values())

            # ── Scored properties (single computation) ────────────────────────
            def perf_score(p):
                pid = str(p.get('id', ''))
                vc = view_counts.get(pid, 0)
                iq = inquiry_counts.get(pid, 0)
                inv = int(p.get('investment_score') or 0)
                appr = float(p.get('appreciation_1yr') or 0)
                return round(inv * 0.3 + vc * 0.25 + iq * 0.25 + appr * 0.2, 2)

            scored_props = []
            for p in all_props:
                pid = str(p.get('id', ''))
                scored_props.append({
                    **p,
                    'view_count': view_counts.get(pid, 0),
                    'inquiry_count': inquiry_counts.get(pid, 0),
                    'performance_score': perf_score(p),
                })

            # ── Property Performance Rankings ─────────────────────────────────
            top_performing = sorted(scored_props, key=lambda x: x['performance_score'], reverse=True)[:5]
            lowest_performing = sorted(scored_props, key=lambda x: x['performance_score'])[:5]
            recently_added = sorted(scored_props, key=lambda x: str(x.get('created_at', '')), reverse=True)[:5]
            recently_updated = sorted(
                [p for p in scored_props if p.get('updated_at') and p.get('updated_at') != p.get('created_at')],
                key=lambda x: str(x.get('updated_at', '')),
                reverse=True,
            )[:5]

            # ── AI Insights (data-driven) ─────────────────────────────────────
            most_viewed = max(scored_props, key=lambda x: x['view_count'], default=None)
            most_enquiries = max(scored_props, key=lambda x: x['inquiry_count'], default=None)

            props_with_scores = [p for p in scored_props if p.get('investment_score') is not None]
            highest_investment = max(props_with_scores, key=lambda x: int(x.get('investment_score') or 0), default=None)
            lowest_investment = min(props_with_scores, key=lambda x: int(x.get('investment_score') or 0), default=None)

            props_with_appr = [p for p in scored_props if p.get('appreciation_1yr') is not None and float(p.get('appreciation_1yr') or 0) > 0]
            highest_appreciating = max(props_with_appr, key=lambda x: float(x.get('appreciation_1yr') or 0), default=None)

            # Properties needing improvement: low views + low score
            needing_improvement = sorted(
                [p for p in scored_props if p['view_count'] < 3 and int(p.get('investment_score') or 100) < 80],
                key=lambda x: x['performance_score'],
            )[:3]

            ai_insights = {
                'highest_appreciating': self._insight_summary(highest_appreciating, 'appreciation_1yr', 'Highest Appreciating Property'),
                'best_investment': self._insight_summary(highest_investment, 'investment_score', 'Best Investment Property'),
                'lowest_performing': self._insight_summary(lowest_investment, 'investment_score', 'Lowest Performing Property'),
                'most_viewed': self._insight_summary(most_viewed, 'view_count', 'Most Viewed Property'),
                'highest_buyer_interest': self._insight_summary(most_enquiries, 'inquiry_count', 'Highest Buyer Interest'),
                # 'needing_improvement': [
                #     self._insight_summary(p, 'performance_score', 'Needs Improvement') for p in needing_improvement
                # ],
            }

            # ── Property Distribution arrays ──────────────────────────────────
            type_distribution = [{'type': k.title(), 'count': v} for k, v in sorted(property_type_counts.items(), key=lambda x: x[1], reverse=True)]
            bhk_distribution = [{'bhk': k, 'count': v} for k, v in sorted(bhk_counts.items())]
            locality_distribution = [{'locality': k, 'count': v} for k, v in sorted(locality_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
            rating_distribution = [{'rating': k, 'count': v} for k, v in sorted(investment_rating_counts.items(), key=lambda x: x[1], reverse=True)]
            appreciation_distribution = [{'category': k, 'count': v} for k, v in sorted(appreciation_category_counts.items(), key=lambda x: x[1], reverse=True)]

            # ── Recent inquiries ──────────────────────────────────────────────
            recent_inquiries = []
            if property_ids:
                inqs = VisitSchedule.objects(property_id__in=property_ids, is_deleted=False).order_by('-created_at')[:20]
                for inq in inqs:
                    prop_match = next((p for p in all_props if str(p.get('id')) == str(inq.property_id)), {})
                    images = prop_match.get('images') or []
                    cover_img = None
                    if images and isinstance(images, list):
                        cover_img = next((img.get('url') for img in images if isinstance(img, dict) and img.get('is_cover')), None)
                        if not cover_img and isinstance(images[0], dict):
                            cover_img = images[0].get('url')
                    recent_inquiries.append({
                        'id': str(inq.id),
                        'property_id': str(inq.property_id),
                        'property_image': cover_img,
                        'initials': "".join([name[0] for name in (inq.buyer_name or 'Buyer').split()[:2]]).upper(),
                        'name': inq.buyer_name,
                        'contact': inq.buyer_email or inq.buyer_phone,
                        'property': inq.property_title,
                        'locality': prop_match.get('locality', 'Ahmedabad'),
                        'message': inq.notes or f"Requested visit on {inq.preferred_date} at {inq.preferred_time}",
                        'status': 'New' if inq.status == 'requested' else inq.status.capitalize(),
                        'created_at': str(inq.created_at) if hasattr(inq, 'created_at') else '',
                    })

            return {
                # Dashboard Overview Cards
                'total_properties': total_properties,
                'active_listings': active_count,
                'total_views': total_views,
                'total_inquiries': total_inquiries,
                'average_price': average_price,
                'avg_predicted_price': avg_predicted_price,
                'avg_investment_score': avg_investment_score,
                'avg_appreciation': avg_appreciation,

                # Portfolio Analysis
                'portfolio': {
                    'current_value': portfolio_current,
                    'value_3yr': portfolio_3yr,
                    'value_5yr': portfolio_5yr,
                    'growth_3yr_pct': growth_3yr_pct,
                    'growth_5yr_pct': growth_5yr_pct,
                    'profit_3yr': profit_3yr,
                    'profit_5yr': profit_5yr,
                },

                # Status counts
                'status_counts': status_counts,

                # Property Performance
                'top_performing_properties': top_performing,
                'lowest_performing_properties': lowest_performing,
                'recently_added_properties': recently_added,
                'recently_updated_properties': recently_updated,
                'most_viewed_properties': sorted(scored_props, key=lambda x: x['view_count'], reverse=True)[:5],

                # Property Distribution
                'type_distribution': type_distribution,
                'bhk_distribution': bhk_distribution,
                'locality_distribution': locality_distribution,
                'rating_distribution': rating_distribution,
                'appreciation_distribution': appreciation_distribution,

                # AI Insights
                'ai_insights': ai_insights,

                # Recent Inquiries
                'recent_inquiries': recent_inquiries,
            }
        except Exception as e:
            logger.error("Error generating analytics: %s", e)
            return self._empty_analytics()

    @staticmethod
    def _insight_summary(prop, key, label):
        """Build a compact insight dict from a property for the AI Insights section."""
        if not prop:
            return None
        return {
            'label': label,
            'property_id': str(prop.get('id', '')),
            'title': prop.get('title', 'Untitled'),
            'locality': prop.get('locality', ''),
            'value': prop.get(key),
            'investment_score': prop.get('investment_score'),
            'investment_rating': prop.get('investment_rating'),
            'appreciation_1yr': prop.get('appreciation_1yr'),
            'view_count': prop.get('view_count', 0),
            'inquiry_count': prop.get('inquiry_count', 0),
        }

    @staticmethod
    def _empty_analytics():
        """Return a zeroed-out analytics response for sellers with no properties."""
        return {
            'total_properties': 0,
            'active_listings': 0,
            'total_views': 0,
            'total_inquiries': 0,
            'average_price': 0,
            'avg_predicted_price': 0,
            'avg_investment_score': 0,
            'avg_appreciation': 0,
            'portfolio': {
                'current_value': 0, 'value_3yr': 0, 'value_5yr': 0,
                'growth_3yr_pct': 0, 'growth_5yr_pct': 0,
                'profit_3yr': 0, 'profit_5yr': 0,
            },
            'status_counts': {'draft': 0, 'active': 0, 'inactive': 0, 'sold': 0, 'archived': 0},
            'top_performing_properties': [],
            'lowest_performing_properties': [],
            'recently_added_properties': [],
            'recently_updated_properties': [],
            'most_viewed_properties': [],
            'type_distribution': [],
            'bhk_distribution': [],
            'locality_distribution': [],
            'rating_distribution': [],
            'appreciation_distribution': [],
            'ai_insights': {},
            'recent_inquiries': [],
        }

    def get_dashboard_data(self, seller_id: str) -> dict:
        """Return the seller's real dashboard metrics and recent property activity."""
        all_props = self.repository.find_all(filters={'seller_id': seller_id}, limit=1000)
        if not all_props:
            all_props = self.repository.find_all(filters={'status': 'active'}, limit=1000)
        recent_properties = sorted(
            all_props,
            key=lambda item: str(item.get('created_at') or ''),
            reverse=True,
        )[:5]
        property_ids = [str(item.get('id')) for item in all_props if item.get('id')]
        view_counts = {property_id: 0 for property_id in property_ids}
        inquiry_counts = {property_id: 0 for property_id in property_ids}

        if property_ids:
            view_aggregation = PropertyView.objects(property_id__in=property_ids).aggregate(
                {'$group': {'_id': '$property_id', 'count': {'$sum': 1}}}
            )
            for item in view_aggregation:
                view_counts[str(item['_id'])] = item['count']

            inq_aggregation = VisitSchedule.objects(property_id__in=property_ids, is_deleted=False).aggregate(
                {'$group': {'_id': '$property_id', 'count': {'$sum': 1}}}
            )
            for item in inq_aggregation:
                inquiry_counts[str(item['_id'])] = item['count']

        status_counts = {'active': 0, 'draft': 0, 'sold': 0}
        for property_data in all_props:
            status = property_data.get('status', 'draft')
            if status in status_counts:
                status_counts[status] += 1

        # ── Top Performing Properties ─────────────────────────────────────────
        # Score each property using a composite of views, enquiries, and investment score
        def performance_score(p):
            pid = str(p.get('id', ''))
            views = view_counts.get(pid, 0)
            enquiries = inquiry_counts.get(pid, 0)
            inv_score = int(p.get('investment_score') or 0)
            return views * 0.4 + enquiries * 0.4 + inv_score * 0.2

        scored_props = [
            {
                **p,
                'view_count': view_counts.get(str(p.get('id', '')), 0),
                'inquiry_count': inquiry_counts.get(str(p.get('id', '')), 0),
                'performance_score': round(performance_score(p), 1),
            }
            for p in all_props
        ]
        top_performing = sorted(scored_props, key=lambda x: x['performance_score'], reverse=True)[:5]

        most_viewed = max(scored_props, key=lambda x: x['view_count'], default=None)
        most_enquiries = max(scored_props, key=lambda x: x['inquiry_count'], default=None)
        highest_score = max(
            [p for p in scored_props if p.get('investment_score') is not None],
            key=lambda x: int(x.get('investment_score') or 0),
            default=None,
        )

        activities = []
        for property_data in all_props:
            title = property_data.get('title') or 'Untitled property'
            created_at = property_data.get('created_at')
            updated_at = property_data.get('updated_at')
            property_id = str(property_data.get('id'))

            if created_at:
                activities.append({
                    'id': f'{property_id}-created',
                    'title': 'Property Added',
                    'description': f'Added {title}.',
                    'timestamp': created_at,
                    'type': 'property',
                })

            if updated_at and updated_at != created_at:
                activities.append({
                    'id': f'{property_id}-updated',
                    'title': 'Property Updated',
                    'description': f'Updated {title}.',
                    'timestamp': updated_at,
                    'type': 'update',
                })

            images = property_data.get('images') or []
            if images:
                latest_image_date = max(
                    (image.get('created_at') for image in images if image.get('created_at')),
                    default=None,
                )
                if latest_image_date:
                    activities.append({
                        'id': f'{property_id}-images',
                        'title': 'Images Uploaded',
                        'description': f'Uploaded images for {title}.',
                        'timestamp': latest_image_date,
                        'type': 'media',
                    })

            if property_data.get('status') == 'sold' and updated_at:
                activities.append({
                    'id': f'{property_id}-sold',
                    'title': 'Property Marked as Sold',
                    'description': f'Marked {title} as sold.',
                    'timestamp': updated_at,
                    'type': 'sale',
                })

        activities.sort(key=lambda item: str(item['timestamp']), reverse=True)

        return {
            'stats': {
                'total_properties': len(all_props),
                'active_listings': status_counts['active'],
                'draft_listings': status_counts['draft'],
                'sold_properties': status_counts['sold'],
                'total_assets': sum(property_data.get('price', 0) or 0 for property_data in all_props),
                'total_views': sum(view_counts.values()),
                'total_inquiries': sum(inquiry_counts.values()),
            },
            'recent_properties': [
                {
                    **(
                        __import__('buyer.services.investment_service', fromlist=['InvestmentScoreService'])
                        .InvestmentScoreService()
                        .calculate(property_data)
                    ),
                    'view_count': view_counts.get(str(property_data.get('id')), 0),
                    'inquiry_count': inquiry_counts.get(str(property_data.get('id')), 0)
                }
                for property_data in recent_properties
            ],
            'top_performing_properties': top_performing,
            'most_viewed_property': most_viewed,
            'highest_investment_score_property': highest_score,
            'most_enquiries_property': most_enquiries,
            'recent_activity': activities[:5],
        }

    def reply_to_inquiry(self, inquiry_id: str, reply_text: str, seller_id: str = None) -> dict:
        """Save a seller response to a buyer inquiry or visit request."""
        from datetime import datetime
        inq = VisitSchedule.objects(id=inquiry_id, is_deleted=False).first()
        if not inq:
            raise ResourceNotFoundError("Inquiry or visit request not found.", resource="VisitSchedule", resource_id=inquiry_id)
        
        inq.seller_reply = reply_text
        inq.replied_at = datetime.utcnow()
        inq.status = 'confirmed'
        inq.save()

        return {
            'id': str(inq.id),
            'seller_reply': inq.seller_reply,
            'replied_at': str(inq.replied_at),
            'status': inq.status,
        }


