"""
seller/views/seller_request_views.py — Seller Request Management & Profile Views
"""

from datetime import datetime
import uuid
from core.base.view import BaseAPIView
from core.exceptions.base import ValidationError, ResourceNotFoundError
from accounts.permissions import IsSeller
from buyer.models.visit_schedule import VisitSchedule, InquiryMessage
from seller.models.property import Property
from accounts.models import User


class SellerRequestsListView(BaseAPIView):
    """GET /api/seller/requests/ — List all incoming visit & inquiry requests for seller's properties."""
    permission_classes = [IsSeller]

    def get(self, request):
        seller_id = str(request.user.id)
        
        # Get property IDs owned by seller
        seller_props = Property.objects(seller_id=seller_id, is_deleted=False)
        seller_prop_ids = [str(p.id) for p in seller_props]
        
        # Query visit schedules linked to seller_id OR matching seller_prop_ids
        requests_docs = VisitSchedule.objects(
            __raw__={
                'is_deleted': False,
                '$or': [
                    {'seller_id': seller_id},
                    {'property_id': {'$in': seller_prop_ids}}
                ]
            }
        ).order_by('-created_at')

        results = []
        for d in requests_docs:
            item = d.to_dict()
            # Privacy Gating check: mask contact info if not yet confirmed or responded
            has_reply = bool(d.seller_reply) or any(m.sender_role == 'seller' for m in d.messages)
            is_unlocked = (d.status == 'confirmed') or has_reply
            
            item['contact_unlocked'] = is_unlocked
            if not is_unlocked:
                if item.get('buyer_phone'):
                    phone = str(item['buyer_phone'])
                    item['buyer_phone'] = phone[:3] + '*****' + phone[-2:] if len(phone) >= 5 else '******'
                if item.get('buyer_email'):
                    email = str(item['buyer_email'])
                    parts = email.split('@')
                    item['buyer_email'] = parts[0][:2] + '***@' + parts[1] if len(parts) == 2 else '***@***.com'
            
            results.append(item)

        return self.success_response(data=results, message="Seller requests fetched successfully.")


class SellerRequestActionView(BaseAPIView):
    """POST /api/seller/requests/<id>/action/ — Accept, Reject, or Suggest New Time for Visit."""
    permission_classes = [IsSeller]

    def post(self, request, pk):
        action = request.data.get('action') # 'accept' | 'reject' | 'suggest_time'
        if action not in ['accept', 'reject', 'suggest_time']:
            raise ValidationError("Action must be one of 'accept', 'reject', or 'suggest_time'.")

        seller_id = str(request.user.id)
        req_doc = VisitSchedule.objects(id=pk, is_deleted=False).first()
        if not req_doc:
            raise ResourceNotFoundError("Request not found.", resource="VisitSchedule", resource_id=pk)

        if action == 'accept':
            req_doc.status = 'confirmed'
            req_doc.seller_reply = "Site Visit Confirmed by Seller."
            req_doc.replied_at = datetime.utcnow()
        elif action == 'reject':
            req_doc.status = 'rejected'
            req_doc.seller_reply = request.data.get('reason', 'Request declined by seller.')
            req_doc.replied_at = datetime.utcnow()
        elif action == 'suggest_time':
            req_doc.status = 'rescheduled'
            req_doc.suggested_date = request.data.get('suggested_date', req_doc.preferred_date)
            req_doc.suggested_time = request.data.get('suggested_time', req_doc.preferred_time)
            req_doc.seller_reply = f"Suggested alternate time slot: {req_doc.suggested_date} at {req_doc.suggested_time}"
            req_doc.replied_at = datetime.utcnow()

        req_doc.save()
        item = req_doc.to_dict()
        item['contact_unlocked'] = (req_doc.status == 'confirmed') or bool(req_doc.seller_reply)
        return self.success_response(data=item, message=f"Request status updated to {req_doc.status}.")


class SellerRequestReplyView(BaseAPIView):
    """POST /api/seller/requests/<id>/reply/ — Reply to inquiry conversation thread."""
    permission_classes = [IsSeller]

    def post(self, request, pk):
        seller_id = str(request.user.id)
        reply_text = request.data.get('message', '').strip() or request.data.get('reply', '').strip()
        if not reply_text:
            raise ValidationError("Reply message text cannot be empty.")

        req_doc = VisitSchedule.objects(id=pk, is_deleted=False).first()
        if not req_doc:
            raise ResourceNotFoundError("Request not found.", resource="VisitSchedule", resource_id=pk)

        seller_name = request.user.full_name or 'Seller'

        new_msg = InquiryMessage(
            id=str(uuid.uuid4())[:8],
            sender_id=seller_id,
            sender_role='seller',
            sender_name=seller_name,
            message=reply_text,
            created_at=datetime.utcnow()
        )
        req_doc.messages.append(new_msg)
        req_doc.seller_reply = reply_text
        req_doc.replied_at = datetime.utcnow()
        if req_doc.status == 'requested':
            req_doc.status = 'confirmed'
        req_doc.save()

        item = req_doc.to_dict()
        item['contact_unlocked'] = True
        return self.success_response(data=item, message="Reply sent successfully.")


class SellerProfileView(BaseAPIView):
    """GET / PUT /api/seller/profile/ — Fetch & update Seller Profile details."""
    permission_classes = [IsSeller]

    def get(self, request):
        user = request.user
        seller_id = str(user.id)
        
        prop_count = Property.objects(seller_id=seller_id, is_deleted=False).count()
        req_count = VisitSchedule.objects(seller_id=seller_id, is_deleted=False).count()

        return self.success_response(
            data={
                'id': seller_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'company': getattr(user, 'company', 'Apex Developers & Realty'),
                'about': getattr(user, 'about', 'Verified premium property developer & seller in Ahmedabad.'),
                'total_properties': prop_count,
                'total_inquiries': req_count,
                'response_rate': 98,
                'avg_response_time': '< 15 mins',
            },
            message="Seller profile data fetched."
        )

    def put(self, request):
        user = request.user
        data = request.data

        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        
        user.save()

        return self.success_response(
            data={
                'id': str(user.id),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'email': user.email,
                'phone_number': user.phone_number,
            },
            message="Seller profile updated successfully."
        )
