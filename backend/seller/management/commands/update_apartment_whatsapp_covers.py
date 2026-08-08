"""
Management command to update all apartment properties in MongoDB with WhatsApp cover photos.
Assigns photos from backend/media/properties/whatsapp/ exclusively to apartment/flat properties.
"""

import os
from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from django.conf import settings
from seller.models.property import Property, PropertyImage

WHATSAPP_IMAGES_COUNT = 26

class Command(BaseCommand):
    help = 'Update all apartment properties in MongoDB to use WhatsApp photos as cover photos'

    def handle(self, *args, **options):
        apartments = Property.objects(
            __raw__={'property_type': {'$in': ['apartment', 'flat']}}
        )
        total = apartments.count()
        self.stdout.write(f'Found {total} apartment properties in database to update with WhatsApp cover photos.')

        updated_count = 0
        for idx, prop in enumerate(apartments):
            cover_num = (idx % WHATSAPP_IMAGES_COUNT) + 1
            rel_url = f'/media/properties/whatsapp/whatsapp_cover_{cover_num}.jpeg'
            file_path = os.path.join(settings.MEDIA_ROOT, 'properties', 'whatsapp', f'whatsapp_cover_{cover_num}.jpeg')
            img_id = f'wa_cover_{idx+1}'

            cover_img = PropertyImage(
                id=img_id,
                url=rel_url,
                file_path=file_path,
                is_cover=True,
                caption=f'{prop.title} Cover Photo',
                created_at=datetime.now(timezone.utc)
            )

            # Ensure all other images have is_cover = False
            new_images = [cover_img]
            if prop.images:
                for img in prop.images:
                    if img.id != img_id and not (img.url and 'whatsapp_cover_' in img.url):
                        img.is_cover = False
                        new_images.append(img)

            prop.images = new_images
            prop.save()
            updated_count += 1

            if updated_count % 250 == 0 or updated_count == total:
                self.stdout.write(f'  Updated {updated_count}/{total} apartment properties...')

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Successfully updated {updated_count} apartment properties in database with WhatsApp cover photos!'
        ))
