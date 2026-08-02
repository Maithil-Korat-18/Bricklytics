"""
core/base/document.py — BaseDocument (MongoEngine)
====================================================
All MongoEngine documents in Bricklytics should inherit from this.

Features:
  - auto created_at / updated_at timestamps
  - soft-delete support (is_deleted flag)
  - helper: to_dict() for clean serialisation
  - helper: get_or_404() for safe lookups
"""

import logging
from datetime import datetime, timezone

import mongoengine as me
from mongoengine import DoesNotExist
from bson import ObjectId

from core.exceptions.base import ResourceNotFoundError

logger = logging.getLogger('bricklytics.db')


class BaseDocument(me.Document):
    """
    Abstract MongoEngine Document with audit timestamps and soft-delete.

    Usage:
        class Property(BaseDocument):
            title = me.StringField(required=True)
            meta = {'collection': 'properties'}
    """

    created_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))
    is_deleted = me.BooleanField(default=False)

    meta = {
        'abstract': True,
        'indexes': [
            'created_at',
            'is_deleted',
        ],
    }

    def save(self, *args, **kwargs):
        """Auto-update updated_at on every save."""
        self.updated_at = datetime.now(timezone.utc)
        return super().save(*args, **kwargs)

    def soft_delete(self) -> None:
        """Mark document as deleted without removing from DB."""
        self.is_deleted = True
        self.save()
        logger.info('%s[%s] soft-deleted.', self.__class__.__name__, self.pk)

    def to_dict(self) -> dict:
        """
        Serialise document to a plain Python dict.
        Converts ObjectId → str and datetime → ISO string.
        """
        def serialize_value(value):
            if isinstance(value, datetime):
                return value.isoformat()
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, me.EmbeddedDocument):
                return {
                    field_name: serialize_value(getattr(value, field_name, None))
                    for field_name in value._fields
                }
            if isinstance(value, me.Document):
                return str(value.pk)
            if isinstance(value, dict):
                return {key: serialize_value(item) for key, item in value.items()}
            if isinstance(value, (list, tuple)):
                return [serialize_value(item) for item in value]
            return value

        data = {
            field_name: serialize_value(getattr(self, field_name, None))
            for field_name in self._fields
        }

        # Always return string id
        data['id'] = str(self.pk)
        data.pop('_cls', None)
        return data

    @classmethod
    def get_or_404(cls, resource_id: str, **kwargs):
        """
        Fetch a document by id; raise ResourceNotFoundError if missing.

        Args:
            resource_id: MongoDB ObjectId string.
            **kwargs:    Additional filter kwargs.

        Returns:
            Document instance.

        Raises:
            ResourceNotFoundError
        """
        try:
            return cls.objects.get(pk=resource_id, is_deleted=False, **kwargs)
        except (DoesNotExist, me.ValidationError):
            raise ResourceNotFoundError(
                f'{cls.__name__} not found.',
                resource=cls.__name__,
                resource_id=resource_id,
            )

    @classmethod
    def active(cls):
        """QuerySet filtered to non-deleted documents."""
        return cls.objects.filter(is_deleted=False)
