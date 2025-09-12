# 🔄 NIVEL 2: Middleware de Cache Inteligente
# Optimización avanzada para respuestas HTTP y control de cache

import json
import hashlib
import time
import logging
from typing import Optional, Dict, Any
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.urls import resolve
from django.utils import timezone

logger = logging.getLogger('cardiovascular.cache_middleware')

class IntelligentCacheMiddleware(MiddlewareMixin):
    """
    Middleware de cache inteligente que optimiza respuestas basándose en:
    - Tipo de endpoint
    - Método HTTP
    - Parámetros de consulta
    - Headers de usuario
    """
    
    # Configuración de cache por endpoint
    CACHE_CONFIG = {
        # Endpoints que se pueden cachear (GET únicamente)
        'predictions:prediction-statistics': {'timeout': 900, 'vary_on': ['user_id']},  # 15 min
        'predictions:modelperformance-list': {'timeout': 3600, 'vary_on': []},  # 1 hora
        'patients:patient-list': {'timeout': 300, 'vary_on': ['user_id', 'query']},  # 5 min
        'patients:patient-statistics': {'timeout': 600, 'vary_on': ['user_id']},  # 10 min
        'authentication:user-profile': {'timeout': 1800, 'vary_on': ['user_id']},  # 30 min
    }
    
    # Endpoints que nunca se cachean
    NEVER_CACHE = {
        'predictions:prediction-predict',  # Predicciones siempre fresh
        'predictions:prediction-batch-predict',
        'authentication:login',
        'authentication:logout',
        'authentication:token-refresh'
    }
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """Verifica si hay una respuesta cacheada disponible."""
        
        # Solo procesar GET requests
        if request.method != 'GET':
            return None
        
        try:
            # Resolver endpoint
            url_name = self._get_url_name(request)
            if not url_name:
                return None
            
            # Verificar si el endpoint debe ser cacheado
            if url_name in self.NEVER_CACHE:
                return None
            
            cache_config = self.CACHE_CONFIG.get(url_name)
            if not cache_config:
                return None
            
            # Generar clave de cache
            cache_key = self._generate_cache_key(request, url_name, cache_config['vary_on'])
            
            # Intentar obtener respuesta cacheada
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.info(f"Cache HIT: {url_name} - {cache_key[:12]}...")
                
                # Crear respuesta JSON con metadatos de cache
                response_data = {
                    **cached_response['data'],
                    '_cache_info': {
                        'hit': True,
                        'cached_at': cached_response['cached_at'],
                        'expires_at': cached_response['expires_at'],
                        'cache_key': cache_key[:12] + '...',
                        'endpoint': url_name
                    }
                }
                
                response = JsonResponse(response_data)
                response['Cache-Control'] = f"max-age={cache_config['timeout']}, public"
                response['X-Cache-Status'] = 'HIT'
                response['X-Cache-Key'] = cache_key[:12] + '...'
                
                return response
            
            logger.info(f"Cache MISS: {url_name} - {cache_key[:12]}...")
            
        except Exception as e:
            logger.error(f"Error en process_request: {e}")
        
        return None
    
    def process_response(self, request, response):
        """Cachea la respuesta si cumple los criterios."""
        
        # Solo procesar GET requests exitosas
        if request.method != 'GET' or not (200 <= response.status_code < 300):
            return response
        
        try:
            # Resolver endpoint
            url_name = self._get_url_name(request)
            if not url_name:
                return response
            
            # Verificar si el endpoint debe ser cacheado
            if url_name in self.NEVER_CACHE:
                return response
            
            cache_config = self.CACHE_CONFIG.get(url_name)
            if not cache_config:
                return response
            
            # Solo cachear respuestas JSON
            if not response.get('Content-Type', '').startswith('application/json'):
                return response
            
            # Generar clave de cache
            cache_key = self._generate_cache_key(request, url_name, cache_config['vary_on'])
            
            # Preparar datos para cache
            if hasattr(response, 'content'):
                try:
                    response_data = json.loads(response.content.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return response
                
                # Preparar objeto para cache
                cache_object = {
                    'data': response_data,
                    'cached_at': timezone.now().isoformat(),
                    'expires_at': (timezone.now() + timezone.timedelta(seconds=cache_config['timeout'])).isoformat(),
                    'url_name': url_name,
                    'status_code': response.status_code,
                    'headers': dict(response.items())
                }
                
                # Guardar en cache
                success = cache.set(cache_key, cache_object, cache_config['timeout'])
                
                if success:
                    logger.info(f"Cache SET: {url_name} - {cache_key[:12]}... (timeout: {cache_config['timeout']}s)")
                    
                    # Agregar headers de cache a la respuesta original
                    response['Cache-Control'] = f"max-age={cache_config['timeout']}, public"
                    response['X-Cache-Status'] = 'MISS'
                    response['X-Cache-Key'] = cache_key[:12] + '...'
                else:
                    logger.warning(f"Failed to cache: {url_name} - {cache_key[:12]}...")
            
        except Exception as e:
            logger.error(f"Error en process_response: {e}")
        
        return response
    
    def _get_url_name(self, request) -> Optional[str]:
        """Obtiene el nombre del endpoint resuelto."""
        try:
            resolved = resolve(request.path_info)
            if resolved.namespace:
                return f"{resolved.namespace}:{resolved.url_name}"
            return resolved.url_name
        except Exception:
            return None
    
    def _generate_cache_key(self, request, url_name: str, vary_on: list) -> str:
        """Genera una clave de cache única."""
        
        key_components = [
            'intelligent_cache',
            url_name,
            request.path_info
        ]
        
        # Agregar componentes variables
        for vary_field in vary_on:
            if vary_field == 'user_id':
                user_id = getattr(request.user, 'id', 'anonymous')
                key_components.append(f"user:{user_id}")
            
            elif vary_field == 'query':
                # Incluir parámetros de consulta importantes
                query_params = dict(request.GET.items())
                # Filtrar parámetros de paginación y timestamp
                filtered_params = {
                    k: v for k, v in query_params.items() 
                    if k not in ['page', 'page_size', 'timestamp', 'force_refresh']
                }
                if filtered_params:
                    query_str = json.dumps(filtered_params, sort_keys=True)
                    key_components.append(f"query:{hashlib.md5(query_str.encode()).hexdigest()[:8]}")
            
            elif vary_field == 'version':
                # Incluir versión de API si está disponible
                version = request.META.get('HTTP_ACCEPT_VERSION', '1.0')
                key_components.append(f"version:{version}")
        
        # Crear clave final
        key_string = ':'.join(str(comp) for comp in key_components)
        
        # Usar hash para claves muy largas
        if len(key_string) > 200:
            return f"cache:{hashlib.md5(key_string.encode()).hexdigest()}"
        
        return key_string.replace(' ', '_').replace(':', '-')

class CacheInvalidationMiddleware(MiddlewareMixin):
    """
    Middleware que invalida cache automáticamente cuando hay cambios.
    """
    
    # Patrones de invalidación
    INVALIDATION_PATTERNS = {
        'POST': ['predictions', 'patients'],  # Crear invalida listados
        'PUT': ['predictions', 'patients'],   # Actualizar invalida detalles y listados
        'PATCH': ['predictions', 'patients'], # Actualización parcial
        'DELETE': ['predictions', 'patients'] # Eliminar invalida todo
    }
    
    def process_response(self, request, response):
        """Invalida cache después de operaciones de modificación."""
        
        # Solo procesar métodos de modificación exitosos
        if request.method not in self.INVALIDATION_PATTERNS:
            return response
        
        if not (200 <= response.status_code < 300):
            return response
        
        try:
            # Obtener patrones a invalidar
            patterns_to_invalidate = self.INVALIDATION_PATTERNS.get(request.method, [])
            
            for pattern in patterns_to_invalidate:
                # Invalidar cache basándose en patrones
                self._invalidate_pattern(pattern, request)
            
            logger.info(f"Cache invalidated for {request.method} on {request.path_info}")
            
        except Exception as e:
            logger.error(f"Error en cache invalidation: {e}")
        
        return response
    
    def _invalidate_pattern(self, pattern: str, request):
        """Invalida cache basándose en un patrón."""
        try:
            # Esta es una implementación simplificada
            # En producción, se usaría una estrategia más sofisticada con Redis patterns
            
            if pattern == 'patients':
                # Invalidar cache de listados de pacientes
                user_id = getattr(request.user, 'id', 'anonymous')
                potential_keys = [
                    f'intelligent_cache-patients-patient-list-user-{user_id}',
                    f'intelligent_cache-patients-patient-statistics-user-{user_id}'
                ]
                
                for key in potential_keys:
                    cache.delete(key)
            
            elif pattern == 'predictions':
                # Invalidar cache de predicciones y estadísticas
                user_id = getattr(request.user, 'id', 'anonymous')
                potential_keys = [
                    f'intelligent_cache-predictions-prediction-statistics-user-{user_id}',
                    'intelligent_cache-predictions-modelperformance-list'
                ]
                
                for key in potential_keys:
                    cache.delete(key)
            
        except Exception as e:
            logger.error(f"Error invalidating pattern {pattern}: {e}")

# Middleware de performance para medir tiempos
class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Monitorea performance de requests con cache."""
    
    def process_request(self, request):
        request._start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            
            # Agregar header con tiempo de respuesta
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Log de performance para requests lentos
            if duration > 1.0:
                logger.warning(f"Slow request: {request.method} {request.path} - {duration:.3f}s")
            
            # Log de cache performance
            cache_status = response.get('X-Cache-Status', 'BYPASS')
            logger.info(f"{request.method} {request.path} - {duration:.3f}s - Cache: {cache_status}")
        
        return response
