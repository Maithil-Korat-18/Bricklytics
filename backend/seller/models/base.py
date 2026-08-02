"""
seller/models/base.py — Seller-Specific Base Document
======================================================
Extends core BaseDocument with seller-domain audit fields.
All seller MongoEngine documents inherit from SellerBaseDocument.
"""

import mongoengine as me
from core.base.document import BaseDocument


class SellerBaseDocument(BaseDocument):
    """
    Abstract base for all Seller module documents.

    Adds:
        - seller_id    : reference to the owning seller (set after auth is added)
        - status       : generic lifecycle status field
        - notes        : optional internal notes field

    Usage:
        class Property(SellerBaseDocument):
            title = me.StringField(required=True)
            meta  = {'collection': 'properties'}
    """

    # Will be a ReferenceField to SellerProfile once auth is added.
    # For now, kept as a StringField placeholder.
    seller_id = me.StringField(required=False, null=True)

    # Generic status — each sub-document defines its own choices
    status = me.StringField(
        default='draft',
        choices=['draft', 'active', 'inactive', 'sold', 'archived'],
    )

    meta = {
        'abstract': True,
        'indexes': [
            'seller_id',
            'status',
        ],
    }
