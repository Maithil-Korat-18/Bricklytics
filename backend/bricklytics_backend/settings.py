"""
Django settings for bricklytics_backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
ML_MODELS_DIR = BASE_DIR / 'ml_models'

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-bricklytics-secret-key-change-in-prod-2026')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
ALLOWED_HOSTS = ['*']  # Or your Render & Vercel domain names
CORS_ALLOW_ALL_ORIGINS = True
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'corsheaders',

    # Local apps
    'core.apps.CoreConfig',
    'common.apps.CommonConfig',
    'accounts.apps.AccountsConfig',
    'seller.apps.SellerConfig',
    'buyer.apps.BuyerConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.request_logging.RequestLoggingMiddleware',
    'core.middleware.error_handler.GlobalErrorHandlerMiddleware',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.vercel.app',
    'https://*.onrender.com',
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = 'bricklytics_backend.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.middleware.jwt_auth.JWTAuthentication',
    ],
    'UNAUTHENTICATED_USER': None,
    'UNAUTHENTICATED_TOKEN': None,
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.handlers.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
}

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/bricklytics_db')
MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'bricklytics_db')
DATABASE_NAME = MONGODB_DB_NAME

# JWT Authentication Config
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

# Real Email SMTP Settings
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend' if EMAIL_HOST_USER else 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', 5))
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Bricklytics <no-reply@bricklytics.com>')

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

