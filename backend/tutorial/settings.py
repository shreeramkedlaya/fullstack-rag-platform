import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

# SECRET_KEY is required by Django. For local development only, auto-generate in DEBUG.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes"):
        SECRET_KEY = "django-insecure-development-key-that-does-not-change"
    else:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be set in environment for non-debug mode"
        )

DEBUG = (
    True
    if os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")
    else False
)

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://www.localhost:5173",
]
CORS_ALLOW_CREDENTIALS = True

# Session storage migrated from DB-only to Redis with DB fallback (cached_db).
# DB-backed sessions were creating write/read load on every request via the 
# global IsAdminForDelete permission check.
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
        # SESSION_COOKIE_AGE is not set in this file, so it defaults to Django's 1209600 (2 weeks).
        # We match the cache TIMEOUT to that default.
        "TIMEOUT": 1209600,
    }
}

# ==============================================================================
# SESSIONS & CSRF CONFIGURATION
# ==============================================================================
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_CACHE_ALIAS = "default"
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True  # Required by Chrome for SameSite=None
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True


ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "authentication",
    "NotesCRUD",
    "Tasks",
    "CustomerOrders",

    # API Gateway for AI Microservice
    "ai_gateway",
    
    # JWT Auth
    "rest_framework_simplejwt",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ==============================================================================
# AUTHENTICATION MODE TOGGLE
# ==============================================================================
# Switch between "session" and "token" to change the entire app's auth scheme.
AUTH_MODE = "token"

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'authentication.permissions.IsAdminForDelete',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        ['authentication.jwt_custom.CustomJWTAuthentication']
        if AUTH_MODE == "token"
        else ['rest_framework.authentication.SessionAuthentication']
    )
}

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # By default, SimpleJWT expects a Django User. We will override the backend,
    # but setting these helps prevent some default validations from throwing errors.
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

ROOT_URLCONF = "tutorial.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "tutorial.wsgi.application"

DB_USER = "root"
DB_PASSWORD = ""
DB_HOST = "127.0.0.1"
DB_PORT = "3306"

_DB_BASE = {
    'ENGINE': 'django.db.backends.mysql',
    'USER': DB_USER,
    'PASSWORD': DB_PASSWORD,
    'HOST': DB_HOST,
    'PORT': DB_PORT,
    'OPTIONS': {
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
        'charset': 'utf8mb4',
        'connect_timeout': 30,
    },
}

_DB_NAMES = [
    'notesapp_db',
    'task_management_db',
    'customer_orders_db',
]

DATABASES = {
    'default': {**_DB_BASE,'NAME': 'djangodatabase','CONN_MAX_AGE': 600},
    **{name: {**_DB_BASE,'NAME': name,'CONN_MAX_AGE': 600}for name in _DB_NAMES},
}

DATABASE_ROUTERS = ["tutorial.db_router.DynamicMetaRouter"]

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
