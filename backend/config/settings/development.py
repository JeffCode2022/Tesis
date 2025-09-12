from .base import *
import os

# Debug settings
DEBUG = True

# Database - PostgreSQL configuration with encoding fix
import logging

logger = logging.getLogger(__name__)

# Force PostgreSQL with proper encoding handling
try:
    import psycopg2
    
    # Test connection with proper encoding
    test_conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'chungadev'),
        database=os.getenv('DB_NAME', 'cardiovascular_db'),
        connect_timeout=5,
        client_encoding='utf8'  # Force UTF8 encoding
    )
    test_conn.close()
    
    # If test passes, use PostgreSQL
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'cardiovascular_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'chungadev'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': {
                'client_encoding': 'UTF8',
            },
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    }
    logger.info("✅ PostgreSQL connection successful - using PostgreSQL")
    
except Exception as e:
    logger.warning(f"⚠️ PostgreSQL error: {e}")
    # Fallback to SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db_dev.sqlite3',
            'OPTIONS': {
                'timeout': 20,
            },
        }
    }
    logger.info("🔄 Using SQLite fallback for development")

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache settings - Mantener configuración completa de base.py
# No sobrescribir CACHES para mantener configuración de sessions
CACHE_TTL = 3600  # 1 hora para desarrollo

# Debug toolbar settings
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# CORS settings are defined in the DEBUG block below

# Configuración de seguridad para desarrollo
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Configuración de seguridad adicional para desarrollo
if DEBUG:
    # CORS settings para desarrollo
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOWED_METHODS = [
        "DELETE",
        "GET",
        "OPTIONS",
        "PATCH",
        "POST",
        "PUT",
    ]
    CORS_ALLOWED_HEADERS = [
        "accept",
        "accept-encoding",
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
    ]
    CORS_EXPOSE_HEADERS = [
        "content-length",
        "content-type",
        "x-csrftoken",
    ]
    CORS_PREFLIGHT_MAX_AGE = 86400
    CORS_ALLOW_PRIVATE_NETWORK = True

    # Other DEBUG settings
    ALLOWED_HOSTS = ['*']
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_HTTPONLY = False
    SESSION_COOKIE_HTTPONLY = False
    CSRF_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SAMESITE = 'Lax'

# Logging settings
LOGGING['handlers']['console'] = {
    'level': 'DEBUG',
    'class': 'logging.StreamHandler',
    'formatter': 'verbose',
}
LOGGING['loggers']['django']['handlers'] = ['console', 'file_general']
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['corsheaders'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': True,
} 