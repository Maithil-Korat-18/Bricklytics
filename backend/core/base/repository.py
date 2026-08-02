"""
core/base/repository.py — BaseRepository
==========================================
All repository classes should inherit from this.

The repository layer:
  - Is the ONLY layer allowed to touch MongoEngine documents
  - Translates database results to plain Python dicts/objects
  - Wraps DB errors in DatabaseError

Usage:
    class PropertyRepository(BaseRepository):
        model = Property

        def find_by_seller(self, seller_id: str) -> list[dict]:
            docs = self.model.active().filter(seller_id=seller_id)
            return [d.to_dict() for d in docs]
"""

import logging
from typing import Any, Type

from mongoengine import Document

from core.base.document import BaseDocument
from core.exceptions.base import DatabaseError, ResourceNotFoundError


class BaseRepository:
    """
    Base repository providing generic CRUD operations over BaseDocument.

    Attributes:
        model: The MongoEngine Document class to operate on.
    """

    model: Type[BaseDocument] = None  # Must be set in subclass

    def __init__(self) -> None:
        if self.model is None:
            raise NotImplementedError(
                f'{self.__class__.__name__} must define `model = <MongoEngineDoc>`'
            )
        self.logger = logging.getLogger(
            f'bricklytics.{self.__class__.__module__}'
        )

    # ── Read ─────────────────────────────────────────────────────────────────

    def find_by_id(self, resource_id: str) -> dict:
        """Fetch a single document or raise ResourceNotFoundError."""
        doc = self.model.get_or_404(resource_id)
        return doc.to_dict()

    def find_all(self, filters: dict | None = None, limit: int = 100, skip: int = 0) -> list[dict]:
        """Fetch a page of active documents matching optional filters."""
        try:
            qs = self.model.active()
            if filters:
                qs = qs.filter(**filters)
            docs = qs.skip(skip).limit(limit)
            return [d.to_dict() for d in docs]
        except Exception as exc:
            self._raise_db_error('find_all', exc)

    def count(self, filters: dict | None = None) -> int:
        """Count documents matching optional filters."""
        try:
            qs = self.model.active()
            if filters:
                qs = qs.filter(**filters)
            return qs.count()
        except Exception as exc:
            self._raise_db_error('count', exc)

    # ── Write ────────────────────────────────────────────────────────────────

    def create(self, data: dict) -> dict:
        """Create a new document from a data dict."""
        try:
            doc = self.model(**data)
            doc.save()
            self.logger.info('%s created id=%s', self.model.__name__, doc.pk)
            return doc.to_dict()
        except Exception as exc:
            self._raise_db_error('create', exc)

    def update(self, resource_id: str, data: dict) -> dict:
        """Update fields on an existing document."""
        try:
            doc = self.model.get_or_404(resource_id)
            for field, value in data.items():
                setattr(doc, field, value)
            doc.save()
            self.logger.info('%s updated id=%s', self.model.__name__, resource_id)
            return doc.to_dict()
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            self._raise_db_error('update', exc)

    def delete(self, resource_id: str) -> None:
        """Soft-delete a document."""
        try:
            doc = self.model.get_or_404(resource_id)
            doc.soft_delete()
            self.logger.info('%s soft-deleted id=%s', self.model.__name__, resource_id)
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            self._raise_db_error('delete', exc)

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _raise_db_error(self, operation: str, exc: Exception) -> None:
        self.logger.exception(
            'DatabaseError in %s.%s: %s', self.__class__.__name__, operation, exc
        )
        raise DatabaseError(
            f'Database error during {operation} on {self.model.__name__}.'
        ) from exc
