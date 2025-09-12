# 📚 NIVEL 1: Configuración personalizada para drf-spectacular
# Hooks de pre y post procesamiento para documentación API

def custom_preprocessing(endpoints):
    """
    Hook de preprocesamiento para personalizar la documentación de endpoints.
    """
    # Agregar información adicional de rate limiting a los endpoints
    rate_limit_info = {
        'predictions': 'Rate limit: 30 requests/minute for authenticated users',
        'patients': 'Rate limit: 60 requests/minute for authenticated users',
        'statistics': 'Rate limit: 100 requests/minute for authenticated users',
    }
    
    for (path, path_regex, method, callback) in endpoints:
        # Agregar información de rate limiting basada en el path
        if hasattr(callback, 'cls'):
            view_name = callback.cls.__name__.lower()
            
            if 'prediction' in view_name:
                callback.cls.schema = getattr(callback.cls, 'schema', None)
                if hasattr(callback.cls, 'schema') and callback.cls.schema:
                    callback.cls.schema.rate_limit_info = rate_limit_info.get('predictions')
            
            elif 'patient' in view_name:
                callback.cls.schema = getattr(callback.cls, 'schema', None)
                if hasattr(callback.cls, 'schema') and callback.cls.schema:
                    callback.cls.schema.rate_limit_info = rate_limit_info.get('patients')
    
    return endpoints

def custom_postprocessing(result, generator, request, public):
    """
    Hook de postprocesamiento para agregar información adicional al esquema OpenAPI.
    """
    # Agregar información de seguridad
    if 'components' not in result:
        result['components'] = {}
    
    if 'securitySchemes' not in result['components']:
        result['components']['securitySchemes'] = {}
    
    # Configurar esquema de autenticación JWT
    result['components']['securitySchemes']['jwtAuth'] = {
        'type': 'http',
        'scheme': 'bearer',
        'bearerFormat': 'JWT',
        'description': 'JWT token obtenido del endpoint /auth/login/'
    }
    
    # Agregar seguridad global
    if 'security' not in result:
        result['security'] = []
    
    result['security'].append({'jwtAuth': []})
    
    # Agregar información de rate limiting global
    if 'info' not in result:
        result['info'] = {}
    
    result['info']['x-rate-limit-info'] = {
        'description': 'Este API implementa rate limiting por usuario',
        'tiers': {
            'anonymous': '5-20 requests/minute',
            'authenticated': '30-120 requests/minute',
            'premium': '100-500 requests/minute',
            'admin': '1000+ requests/minute'
        }
    }
    
    # Agregar información de cache
    result['info']['x-cache-info'] = {
        'description': 'Responses are cached for performance',
        'cache_headers': ['X-Cache-Status', 'X-Cache-Key', 'X-Response-Time'],
        'cache_control': 'Responses include Cache-Control headers with appropriate max-age'
    }
    
    # Agregar ejemplos de respuesta de error comunes
    if 'components' not in result:
        result['components'] = {}
    
    if 'schemas' not in result['components']:
        result['components']['schemas'] = {}
    
    # Esquema de error de rate limiting
    result['components']['schemas']['RateLimitError'] = {
        'type': 'object',
        'properties': {
            'error': {
                'type': 'string',
                'example': 'Rate limit exceeded'
            },
            'message': {
                'type': 'string',
                'example': 'Too many requests. Please try again later.'
            },
            'limit_info': {
                'type': 'object',
                'properties': {
                    'rate': {'type': 'string', 'example': '30/m'},
                    'burst': {'type': 'integer', 'example': 50},
                    'user_tier': {'type': 'string', 'example': 'authenticated'},
                    'endpoint_category': {'type': 'string', 'example': 'predictions'}
                }
            },
            'timestamp': {
                'type': 'string',
                'format': 'date-time',
                'example': '2024-08-24T10:30:00Z'
            }
        }
    }
    
    # Esquema de información de cache
    result['components']['schemas']['CacheInfo'] = {
        'type': 'object',
        'properties': {
            'from_cache': {
                'type': 'boolean',
                'description': 'Indica si la respuesta viene del cache'
            },
            'cached_at': {
                'type': 'string',
                'format': 'date-time',
                'description': 'Timestamp de cuando se cacheó la respuesta'
            },
            'cache_key_hash': {
                'type': 'string',
                'description': 'Hash de la clave de cache (primeros 8 caracteres)'
            }
        }
    }
    
    return result
