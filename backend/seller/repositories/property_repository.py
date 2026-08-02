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
                clean_filters = {k: v for k, v in filters.items() if v is not None}
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
