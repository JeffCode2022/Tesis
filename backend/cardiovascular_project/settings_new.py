"""
Configuración principal del proyecto cardiovascular

IMPORTANTE: Este archivo redirecciona a la configuración modular
ubicada en config/settings/ para mantener compatibilidad.

La configuración original se respaldó en settings_backup.py
"""

import os

# Determinar el entorno
ENVIRONMENT = os.getenv('DJANGO_ENVIRONMENT', 'development')

if ENVIRONMENT == 'production':
    from config.settings.production import *
elif ENVIRONMENT == 'development':
    from config.settings.development import *
else:
    from config.settings.base import *

# Configuraciones adicionales específicas para compatibilidad
try:
    from decouple import config
    
    # ML Models Path - mantenido por compatibilidad
    ML_MODELS_PATH = os.path.join(BASE_DIR, 'ml_models', 'trained_models')
    
    # Configuración para integración con sistema existente
    EXTERNAL_SYSTEM_CONFIG = {
        'HIS_API_URL': config('HIS_API_URL', default=''),
        'HIS_API_KEY': config('HIS_API_KEY', default=''),
        'ENABLE_EXTERNAL_INTEGRATION': config('ENABLE_EXTERNAL_INTEGRATION', default=False, cast=bool),
    }
    
except ImportError:
    # Si decouple no está disponible, usar valores por defecto
    ML_MODELS_PATH = os.path.join(BASE_DIR, 'ml_models', 'trained_models')
    EXTERNAL_SYSTEM_CONFIG = {
        'HIS_API_URL': '',
        'HIS_API_KEY': '',
        'ENABLE_EXTERNAL_INTEGRATION': False,
    }
