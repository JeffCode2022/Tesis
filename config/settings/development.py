from .base import *
import os
from decouple import config
import dj_database_url

# Debug settings
DEBUG = True

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config(
            'DATABASE_URL',
            default='postgresql://postgres:postgres@localhost:5432/cardiovascular_db'
        ),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache settings
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

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
LOGGING['loggers']['django']['handlers'] = ['console', 'file']
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['corsheaders'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': True,
} 