import logging
from django.conf import settings
import datetime
import random
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.core import signing
from django.core.mail import EmailMultiAlternatives
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import EmailVerificationCode, UserPreferenceProfile

User = get_user_model()
logger = logging.getLogger(__name__)

def send_verification_email(email, code, purpose_text):
    """Sends a beautifully styled HTML verification email with the 6-digit OTP."""
    subject = f"Your Verification Code - Property Intelligence"
    
    html_content = f"""
    <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #FAFAF8; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(20,23,31,0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#3E6FE0,#2A54BE); position: relative; display: inline-block;">
                    <span style="position: absolute; inset: 0; margin: auto; width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></span>
                </div>
                <span style="font-family: sans-serif; font-weight: 800; font-size: 20px; color: #14171F; vertical-align: middle; margin-left: 6px;">Bricklytics</span>
            </div>
            <div style="font-size: 12px; color: #8A93A6; margin-top: 4px; letter-spacing: 0.05em; text-transform: uppercase;">Property Intelligence Platform</div>
        </div>
        
        <div style="background-color: #FFFFFF; padding: 36px; border-radius: 16px; box-shadow: 0 10px 30px -15px rgba(17, 24, 39, 0.08); border: 1px solid rgba(20,23,31,0.04);">
            <h3 style="color: #14171F; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Verification Code</h3>
            
            <p style="font-size: 15px; color: #5B6270; line-height: 1.6; margin: 0 0 24px 0;">
                Hello,
            </p>
            <p style="font-size: 15px; color: #5B6270; line-height: 1.6; margin: 0 0 24px 0;">
                You requested a verification code to <strong>{purpose_text}</strong>. Please enter the following 6-digit code on the verification screen:
            </p>
            
            <div style="text-align: center; margin: 36px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3E6FE0; background-color: #FAFAF8; padding: 16px 32px; border-radius: 12px; border: 1px solid rgba(62,111,224,0.12); font-family: 'IBM Plex Mono', monospace; display: inline-block;">
                    {code}
                </span>
            </div>
            
            <p style="font-size: 13px; color: #8A93A6; line-height: 1.5; margin: 28px 0 0 0; border-top: 1px solid rgba(20,23,31,0.06); padding-top: 20px;">
                This code is valid for 15 minutes. If you did not make this request, you can safely ignore this email.
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #8A93A6;">
            &copy; {datetime.datetime.now().year} Bricklytics Property Intelligence. All rights reserved.
        </div>
    </div>
    """
    
    text_content = f"Your verification code is: {code}. It is valid for 15 minutes."
    
    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


class CSRFTokenView(APIView):
    """GET /api/v1/auth/csrf/
    Retrieves a new CSRF token for secure stateful requests.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = get_token(request)
        return Response({"csrfToken": token}, status=status.HTTP_200_OK)


class RegisterSendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        email = email.strip().lower()
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email is already registered. Please log in instead."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 6 digit code
        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + datetime.timedelta(minutes=15)
        
        # Save verification code
        EmailVerificationCode.objects.create(
            email=email,
            code=code,
            purpose="register",
            expires_at=expires_at
        )
        
        # Send Email
        try:
            send_verification_email(email, code, "verify your email to create a Bricklytics account")
        except Exception:
            logger.exception("Failed to send verification email to %s", email)
            return Response({"error": "We couldn't send the verification code. Please try again shortly."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)   
        
        return Response({"detail": "Verification code sent to email successfully."}, status=status.HTTP_200_OK)


class RegisterVerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        
        if not email or not code:
            return Response({"error": "Email and verification code are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = email.strip().lower()
        code = code.strip()
        
        now = timezone.now()
        verification = EmailVerificationCode.objects.filter(
            email=email,
            code=code,
            purpose="register",
            is_used=False,
            expires_at__gt=now
        ).first()
        if not verification:
            return Response({"error": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)
            
        verification.is_used = True
        verification.save()
            
        # Return a signed token valid for 15 mins to proceed to set password
        verification_token = signing.dumps({"email": email, "purpose": "register"})
        
        return Response({
            "detail": "Verification successful.",
            "verification_token": verification_token
        }, status=status.HTTP_200_OK)


class RegisterCompleteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("verification_token")
        name = request.data.get("name")
        password = request.data.get("password")
        role = request.data.get("role", "buyer")
        
        if not token or not name or not password:
            return Response({"error": "Verification token, name, and password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Token valid for 15 minutes max
            payload = signing.loads(token, max_age=900)
        except signing.SignatureExpired:
            return Response({"error": "Verification session expired. Please verify your email again."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"error": "Invalid verification token."}, status=status.HTTP_400_BAD_REQUEST)
            
        if payload.get("purpose") != "register":
            return Response({"error": "Invalid token purpose."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = payload.get("email")
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create user
        # We set username as email since email is unique
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name
        )
        
        # Create user preference profile matching onboarding default
        UserPreferenceProfile.objects.create(
            user=user,
            name="Default",
            weight_education=3,
            weight_safety=3,
            weight_healthcare=3,
            weight_mobility=3,
            weight_traffic=3,
            search_radius_meters=2000
        )
        
        # Establish session-based login
        django_login(request, user)
        
        # Generate JWT (for dual-support if frontend expects it)
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "email": user.email,
                "name": user.first_name,
                "role": role
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        
        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = email.strip().lower()
        
        # Map email to username since our backend stores username=email
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
            
        authenticated_user = authenticate(username=user.username, password=password)
        if not authenticated_user:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Establish session-based login
        django_login(request, authenticated_user)
        
        # Generate JWT
        refresh = RefreshToken.for_user(authenticated_user)
        
        # Get custom profile details if any
        profile = UserPreferenceProfile.objects.filter(user=authenticated_user, name="Default").first()
        profile_data = None
        if profile:
            profile_data = {
                "propertyType": "apartment",
                "budget": 80,
                "priorities": ["safety", "schools"]
            }
            
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "email": authenticated_user.email,
                "name": authenticated_user.first_name
            },
            "profile": profile_data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/v1/auth/logout/
    Logs the user out and clears the session.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        django_logout(request)
        return Response({"detail": "Successfully logged out from session."}, status=status.HTTP_200_OK)


class ForgotSendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = email.strip().lower()
        if not User.objects.filter(email=email).exists():
            return Response({"error": "No account registered with this email address."}, status=status.HTTP_400_BAD_REQUEST)
            
        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + datetime.timedelta(minutes=15)
        
        EmailVerificationCode.objects.create(
            email=email,
            code=code,
            purpose="reset",
            expires_at=expires_at
        )
        
        try:
            send_verification_email(email, code, "verify your email to reset your Bricklytics password")
        except Exception:
            logger.exception("Failed to send password-reset email to %s", email)
            return Response({"error": "We couldn't send the verification code. Please try again shortly."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  
        return Response({"detail": "Verification code sent to email successfully."}, status=status.HTTP_200_OK)


class ForgotVerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        
        if not email or not code:
            return Response({"error": "Email and verification code are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = email.strip().lower()
        code = code.strip()
        
        now = timezone.now()
        verification = EmailVerificationCode.objects.filter(
            email=email,
            code=code,
            purpose="reset",
            is_used=False,
            expires_at__gt=now
        ).first()
        if not verification:
            return Response({"error": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)
            
        verification.is_used = True
        verification.save()
            
        reset_token = signing.dumps({"email": email, "purpose": "reset"})
        
        return Response({
            "detail": "Verification successful.",
            "reset_token": reset_token
        }, status=status.HTTP_200_OK)


class ForgotResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("reset_token")
        password = request.data.get("password")
        
        if not token or not password:
            return Response({"error": "Reset token and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            payload = signing.loads(token, max_age=900)
        except signing.SignatureExpired:
            return Response({"error": "Reset session expired. Please verify your email again."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"error": "Invalid reset token."}, status=status.HTTP_400_BAD_REQUEST)
            
        if payload.get("purpose") != "reset":
            return Response({"error": "Invalid token purpose."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = payload.get("email")
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User no longer exists."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(password)
        user.save()
        
        # Log them in session-wise automatically
        django_login(request, user)
        
        # Generate JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "detail": "Password reset successfully.",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "email": user.email,
                "name": user.first_name
            }
        }, status=status.HTTP_200_OK)
