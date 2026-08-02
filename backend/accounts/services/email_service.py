"""
accounts/services/email_service.py — Production Email Dispatcher
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('bricklytics.email')


class EmailService:
    @staticmethod
    def send_verification_email(email: str, name: str, code: str) -> bool:
        """
        Send 6-digit email verification code via SMTP.
        """
        subject = f"Verification Code: {code} — Bricklytics AI Real Estate"
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .logo {{ font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }}
            .code-box {{ background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; text-align: center; padding: 20px; margin: 24px 0; }}
            .footer {{ margin-top: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏢 Bricklytics</div>
            <h2>Welcome to Bricklytics, {name}!</h2>
            <p>Please enter the following 6-digit verification code to activate your account:</p>
            
            <div class="code-box">{code}</div>
            
            <p>This code will expire in <strong>10 minutes</strong>. If you did not sign up for Bricklytics, please ignore this email.</p>
            
            <div class="footer">
              &copy; {settings.TIME_ZONE} Bricklytics AI Real Estate Platform. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """

        plain_message = f"Hello {name},\n\nYour Bricklytics verification code is: {code}\n\nThis code expires in 10 minutes."
        
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Bricklytics <no-reply@bricklytics.com>')
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=from_email,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Verification email sent successfully to %s", email)
            return True
        except Exception as exc:
            logger.error("Failed to send verification email to %s: %s", email, exc)
            logger.info("[DEV FALLBACK] Verification code for %s is: %s", email, code)
            return False

    @staticmethod
    def send_password_reset_email(email: str, name: str, code: str) -> bool:
        """
        Send password reset OTP email via SMTP.
        """
        subject = f"Reset Password Code: {code} — Bricklytics"
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .logo {{ font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }}
            .code-box {{ background-color: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; text-align: center; padding: 20px; margin: 24px 0; }}
            .footer {{ margin-top: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏢 Bricklytics</div>
            <h2>Reset Password Request</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your Bricklytics password. Use the OTP code below:</p>
            
            <div class="code-box">{code}</div>
            
            <p>This OTP expires in <strong>10 minutes</strong>. If you did not request a password reset, please secure your account immediately.</p>
            
            <div class="footer">
              &copy; Bricklytics AI Real Estate Platform. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """

        plain_message = f"Hi {name},\n\nYour Bricklytics password reset code is: {code}\n\nExpires in 10 minutes."

        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Bricklytics <no-reply@bricklytics.com>')
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=from_email,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Password reset email sent to %s", email)
            return True
        except Exception as exc:
            logger.error("Failed to send reset email to %s: %s", email, exc)
            logger.info("[DEV FALLBACK] Reset code for %s is: %s", email, code)
            return False
