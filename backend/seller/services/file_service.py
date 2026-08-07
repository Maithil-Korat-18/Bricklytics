"""
seller/services/file_service.py — File handling service for Images and PDF Brochures
"""

import os
import uuid
from datetime import datetime, timezone
from PIL import Image
from django.conf import settings
from core.exceptions.base import ValidationError


class FileService:
    ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
    ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf'}

    @classmethod
    def save_image(cls, uploaded_file) -> dict:
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in cls.ALLOWED_IMAGE_EXTENSIONS:
            raise ValidationError(
                message=f"Invalid image format '{ext}'. Allowed formats: {', '.join(cls.ALLOWED_IMAGE_EXTENSIONS)}"
            )

        # Validate Pillow image integrity
        try:
            img = Image.open(uploaded_file)
            img.verify()
            uploaded_file.seek(0)
        except Exception:
            raise ValidationError(message="Uploaded file is not a valid image.")

        img_id = uuid.uuid4().hex
        filename = f"img_{img_id}{ext}"
        relative_path = os.path.join('properties', 'images', filename)
        absolute_path = os.path.join(settings.MEDIA_ROOT, relative_path)

        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)

        with open(absolute_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        url = f"{settings.MEDIA_URL}properties/images/{filename}"

        return {
            'id': img_id,
            'url': url,
            'file_path': absolute_path,
            'is_cover': False,
            'caption': uploaded_file.name,
            'created_at': datetime.now(timezone.utc),
        }

    @classmethod
    def save_brochure(cls, uploaded_file) -> dict:
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in cls.ALLOWED_DOCUMENT_EXTENSIONS:
            raise ValidationError(
                message=f"Invalid document format '{ext}'. Only PDF brochures are allowed."
            )

        doc_id = uuid.uuid4().hex
        filename = f"doc_{doc_id}{ext}"
        relative_path = os.path.join('properties', 'documents', filename)
        absolute_path = os.path.join(settings.MEDIA_ROOT, relative_path)

        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)

        with open(absolute_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        url = f"{settings.MEDIA_URL}properties/documents/{filename}"

        return {
            'id': doc_id,
            'title': uploaded_file.name,
            'url': url,
            'file_path': absolute_path,
            'file_type': 'pdf',
            'created_at': datetime.now(timezone.utc),
        }

    @classmethod
    def delete_file(cls, file_path: str) -> None:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
