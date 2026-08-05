"""
seller/repositories/property_repository.py — Data Access Layer for Properties
"""

from core.base.repository import BaseRepository
from seller.models.property import Property
from core.exceptions.base import DatabaseError


class PropertyRepository(BaseRepository):
    model = Property

    def filter_properties(
        self,
        filters: dict = None,
        search_query: str = None,
        sort_by: str = '-created_at',
        limit: int = 20,
        skip: int = 0,
    ) -> tuple[list[dict], int]:
        """
        Custom query method supporting filtering, searching, sorting, and pagination.
        """
        try:
            qs = self.model.active()

            if filters:
                clean_filters = {}
                for k, v in filters.items():
                    if v is None or v == '':
                        continue
                    if k == 'property_type':
                        val = str(v).lower().strip()
                        if val in ['villa', 'house', 'villa / house']:
                            clean_filters['property_type__in'] = ['villa', 'house', 'Villa / House', 'villa / house']
                        elif val in ['apartment', 'flat', 'flat / apartment']:
                            clean_filters['property_type__in'] = ['apartment', 'flat', 'Flat / Apartment', 'flat / apartment']
                        else:
                            clean_filters[k] = v
                    else:
                        clean_filters[k] = v

                if clean_filters:
                    qs = qs.filter(**clean_filters)


            if search_query:
                qs = qs.filter(title__icontains=search_query)

            total_count = qs.count()

            if sort_by:
                qs = qs.order_by(sort_by)

            docs = qs.skip(skip).limit(limit)
            return [d.to_dict() for d in docs], total_count

        except Exception as exc:
            self._raise_db_error('filter_properties', exc)
