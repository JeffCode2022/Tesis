# 🔄 NIVEL 2: Sistema de Rate Limiting Avanzado
# Protección API con límites inteligentes por usuario y endpoint

from django.http import JsonResponse
from django.core.cache import cache
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from functools import wraps
import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger('cardiovascular.rate_limit')

class SmartRateLimit:
    """Sistema de rate limiting inteligente con diferentes límites por tipo de usuario."""
    
    # Configuración de límites por endpoint y tipo de usuario
    RATE_LIMITS = {
        # Predicciones - Límites más estrictos
        'predictions': {
            'anonymous': {'rate': '5/m', 'burst': 10},      # 5 por minuto, máximo 10
            'authenticated': {'rate': '30/m', 'burst': 50}, # 30 por minuto, máximo 50
            'premium': {'rate': '100/m', 'burst': 200},     # 100 por minuto, máximo 200
            'admin': {'rate': '1000/m', 'burst': 2000}      # Sin límites prácticos
        },
        
        # Consultas de pacientes - Límites moderados
        'patients': {
            'anonymous': {'rate': '10/m', 'burst': 20},
            'authenticated': {'rate': '60/m', 'burst': 100},
            'premium': {'rate': '200/m', 'burst': 300},
            'admin': {'rate': '1000/m', 'burst': 2000}
        },
        
        # Autenticación - Límites estrictos para seguridad
        'auth': {
            'anonymous': {'rate': '3/m', 'burst': 5},       # Muy limitado
            'authenticated': {'rate': '10/m', 'burst': 15},
            'premium': {'rate': '20/m', 'burst': 30},
            'admin': {'rate': '50/m', 'burst': 100}
        },
        
        # Estadísticas - Límites relajados
        'statistics': {
            'anonymous': {'rate': '20/m', 'burst': 30},
            'authenticated': {'rate': '100/m', 'burst': 150},
            'premium': {'rate': '300/m', 'burst': 500},
            'admin': {'rate': '1000/m', 'burst': 2000}
        },
        
        # General - Para endpoints no categorizados
        'general': {
            'anonymous': {'rate': '30/m', 'burst': 50},
            'authenticated': {'rate': '120/m', 'burst': 200},
            'premium': {'rate': '500/m', 'burst': 800},
            'admin': {'rate': '2000/m', 'burst': 4000}
        }
    }
    
    @staticmethod
    def get_user_tier(user) -> str:
        """Determina el tier del usuario para aplicar límites apropiados."""
        if not user or user.is_anonymous:
            return 'anonymous'
        
        if user.is_superuser or user.is_staff:
            return 'admin'
        
        # Verificar si el usuario tiene plan premium (ejemplo)
        if hasattr(user, 'profile') and getattr(user.profile, 'is_premium', False):
            return 'premium'
        
        return 'authenticated'
    
    @staticmethod
    def get_endpoint_category(path: str) -> str:
        """Categoriza el endpoint basándose en la URL."""
        if '/predictions/' in path or '/predict' in path:
            return 'predictions'
        elif '/patients/' in path:
            return 'patients'
        elif '/auth/' in path or '/login' in path or '/token' in path:
            return 'auth'
        elif '/statistics/' in path or '/stats' in path:
            return 'statistics'
        else:
            return 'general'
    
    @classmethod
    def get_rate_for_user(cls, user, path: str) -> Dict[str, str]:
        """Obtiene los límites de rate para un usuario y endpoint específicos."""
        user_tier = cls.get_user_tier(user)
        endpoint_category = cls.get_endpoint_category(path)
        
        limits = cls.RATE_LIMITS.get(endpoint_category, cls.RATE_LIMITS['general'])
        return limits.get(user_tier, limits['authenticated'])

def smart_rate_limit(endpoint_category: Optional[str] = None):
    """
    Decorador de rate limiting inteligente que se adapta al usuario.
    
    Args:
        endpoint_category: Categoría forzada del endpoint (opcional)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            try:
                # Determinar categoría del endpoint
                category = endpoint_category or SmartRateLimit.get_endpoint_category(request.path)
                
                # Obtener límites para el usuario
                limits = SmartRateLimit.get_rate_for_user(request.user, request.path)
                rate = limits['rate']
                
                # Generar clave única para el usuario
                if request.user and not request.user.is_anonymous:
                    key = f"user_{request.user.id}"
                else:
                    # Para usuarios anónimos, usar IP
                    key = f"ip_{request.META.get('REMOTE_ADDR', 'unknown')}"
                
                # Aplicar rate limiting
                @ratelimit(key=lambda group, request: key, rate=rate, method='ALL', block=True)
                def rate_limited_view(request, *args, **kwargs):
                    return func(request, *args, **kwargs)
                
                return rate_limited_view(request, *args, **kwargs)
                
            except Ratelimited:
                # Registrar intento de exceso de límite
                user_info = f"user_{request.user.id}" if request.user and not request.user.is_anonymous else f"ip_{request.META.get('REMOTE_ADDR')}"
                logger.warning(f"Rate limit exceeded for {user_info} on {request.path}")
                
                # Obtener información de límites para la respuesta
                limits = SmartRateLimit.get_rate_for_user(request.user, request.path)
                
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'message': 'Too many requests. Please try again later.',
                    'limit_info': {
                        'rate': limits['rate'],
                        'burst': limits['burst'],
                        'user_tier': SmartRateLimit.get_user_tier(request.user),
                        'endpoint_category': SmartRateLimit.get_endpoint_category(request.path)
                    },
                    'timestamp': timezone.now().isoformat()
                }, status=429)
            
            except Exception as e:
                logger.error(f"Error in rate limiting: {e}")
                # En caso de error, permitir la request
                return func(request, *args, **kwargs)
        
        return wrapper
    return decorator

class RateLimitMiddleware:
    """Middleware para aplicar rate limiting globalmente."""
    
    # Endpoints que siempre tienen rate limiting
    ALWAYS_RATE_LIMITED = [
        '/api/predictions/predict/',
        '/api/predictions/batch_predict/',
        '/api/auth/login/',
        '/api/auth/token/refresh/',
    ]
    
    # Endpoints excluidos de rate limiting
    RATE_LIMIT_EXEMPT = [
        '/health/',
        '/ready/',
        '/api/auth/logout/',  # Logout no debería tener límite
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Verificar si el endpoint debe ser rate limited
        should_rate_limit = (
            request.path in self.ALWAYS_RATE_LIMITED or
            (request.path.startswith('/api/') and request.path not in self.RATE_LIMIT_EXEMPT)
        )
        
        if should_rate_limit:
            try:
                # Obtener límites para el usuario
                limits = SmartRateLimit.get_rate_for_user(request.user, request.path)
                rate = limits['rate']
                
                # Generar clave única
                if request.user and not request.user.is_anonymous:
                    key = f"middleware_user_{request.user.id}"
                else:
                    key = f"middleware_ip_{request.META.get('REMOTE_ADDR', 'unknown')}"
                
                # Verificar límite manualmente
                if self._is_rate_limited(key, rate):
                    logger.warning(f"Rate limit exceeded in middleware for {key} on {request.path}")
                    
                    return JsonResponse({
                        'error': 'Rate limit exceeded',
                        'message': 'Too many requests. Please try again later.',
                        'limit_info': {
                            'rate': limits['rate'],
                            'user_tier': SmartRateLimit.get_user_tier(request.user),
                            'endpoint_category': SmartRateLimit.get_endpoint_category(request.path)
                        },
                        'timestamp': timezone.now().isoformat()
                    }, status=429)
            
            except Exception as e:
                logger.error(f"Error in rate limit middleware: {e}")
                # En caso de error, continuar con la request
        
        response = self.get_response(request)
        
        # Agregar headers informativos sobre rate limiting
        if should_rate_limit:
            try:
                limits = SmartRateLimit.get_rate_for_user(request.user, request.path)
                response['X-RateLimit-Limit'] = limits['rate']
                response['X-RateLimit-Burst'] = str(limits['burst'])
                response['X-RateLimit-Tier'] = SmartRateLimit.get_user_tier(request.user)
            except Exception:
                pass
        
        return response
    
    def _is_rate_limited(self, key: str, rate: str) -> bool:
        """
        Verificación manual de rate limiting usando cache.
        
        Args:
            key: Clave única del usuario/IP
            rate: Límite en formato 'N/period' (ej: '30/m')
        
        Returns:
            True si está limitado, False si puede continuar
        """
        try:
            # Parsear el rate
            count, period = rate.split('/')
            count = int(count)
            
            # Convertir período a segundos
            period_seconds = {
                's': 1,
                'm': 60,
                'h': 3600,
                'd': 86400
            }.get(period, 60)
            
            # Generar clave de cache
            cache_key = f"rate_limit:{key}"
            
            # Obtener contador actual
            current_count = cache.get(cache_key, 0)
            
            if current_count >= count:
                return True
            
            # Incrementar contador
            cache.set(cache_key, current_count + 1, period_seconds)
            return False
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return False  # En caso de error, no limitar

# Decoradores específicos para endpoints comunes
prediction_rate_limit = smart_rate_limit('predictions')
patient_rate_limit = smart_rate_limit('patients')
auth_rate_limit = smart_rate_limit('auth')
statistics_rate_limit = smart_rate_limit('statistics')

def rate_limit_status_view(request):
    """Endpoint para verificar el estado actual del rate limiting del usuario."""
    try:
        user_tier = SmartRateLimit.get_user_tier(request.user)
        
        # Obtener límites para diferentes categorías
        categories_info = {}
        for category in SmartRateLimit.RATE_LIMITS.keys():
            limits = SmartRateLimit.RATE_LIMITS[category].get(user_tier, {})
            categories_info[category] = limits
        
        return JsonResponse({
            'user_tier': user_tier,
            'limits_by_category': categories_info,
            'current_time': timezone.now().isoformat(),
            'user_id': request.user.id if request.user and not request.user.is_anonymous else None
        })
    
    except Exception as e:
        logger.error(f"Error in rate limit status: {e}")
        return JsonResponse({'error': 'Unable to fetch rate limit status'}, status=500)
