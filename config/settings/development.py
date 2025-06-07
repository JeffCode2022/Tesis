from .base import *
import os
from decouple import config
import dj_database_url

# Debug settings
DEBUG = True

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache settings
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Debug toolbar settings
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True

# Logging settings
LOGGING['handlers']['console'] = {
    'level': 'DEBUG',
    'class': 'logging.StreamHandler',
    'formatter': 'verbose',
}
LOGGING['loggers']['django']['handlers'] = ['console', 'file']
LOGGING['loggers']['django']['level'] = 'DEBUG' 