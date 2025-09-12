"""
Middleware personalizado para manejo centralizado de excepciones
"""

import logging
import traceback
import json
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger('cardiovascular.exceptions')

class ExceptionHandlingMiddleware(MiddlewareMixin):
    """
    Middleware para capturar y manejar excepciones de forma centralizada
    """
    
    def process_exception(self, request, exception):
        """
        Procesa excepciones no capturadas en el sistema
        
        Args:
            request: HttpRequest object
            exception: Exception object
            
        Returns:
            JsonResponse si es una API request, None en caso contrario
        """
        
        # Determinar si es una request de API
        is_api_request = (
            request.path.startswith('/api/') or 
            request.content_type == 'application/json' or
            'application/json' in request.META.get('HTTP_ACCEPT', '')
        )
        
        # Preparar contexto de error
        error_context = {
            'timestamp': self._get_timestamp(),
            'request_id': self._get_request_id(request),
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            'user_email': getattr(request.user, 'email', None) if hasattr(request, 'user') else None,
            'path': request.path,
            'method': request.method,
            'remote_addr': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'exception_type': type(exception).__name__,
            'exception_message': str(exception),
        }
        
        # Categorizar excepción
        error_category = self._categorize_exception(exception)
        
        # Log del error
        if error_category['severity'] == 'critical':
            logger.critical(
                f"Critical exception in {request.path}",
                extra={
                    'error_context': error_context,
                    'exception_category': error_category,
                    'traceback': traceback.format_exc() if settings.DEBUG else None
                },
                exc_info=True
            )
        elif error_category['severity'] == 'error':
            logger.error(
                f"Exception in {request.path}: {str(exception)}",
                extra={
                    'error_context': error_context,
                    'exception_category': error_category,
                },
                exc_info=settings.DEBUG
            )
        else:
            logger.warning(
                f"Warning in {request.path}: {str(exception)}",
                extra={
                    'error_context': error_context,
                    'exception_category': error_category,
                }
            )
        
        # Si es request de API, devolver respuesta JSON
        if is_api_request:
            return self._create_api_error_response(exception, error_context, error_category)
        
        # Para requests web normales, dejar que Django maneje
        return None
    
    def _get_timestamp(self):
        """Obtiene timestamp actual en formato ISO"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _get_request_id(self, request):
        """Genera ID único para la request"""
        import uuid
        return str(uuid.uuid4())[:8]
    
    def _get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _categorize_exception(self, exception):
        """
        Categoriza la excepción por tipo y severidad
        
        Args:
            exception: Exception object
            
        Returns:
            dict: Categoría y severidad del error
        """
        exception_type = type(exception).__name__
        
        # Errores críticos del sistema
        critical_exceptions = [
            'DatabaseError', 'OperationalError', 'IntegrityError',
            'RedisConnectionError', 'CeleryError',
            'OutOfMemoryError', 'SystemError'
        ]
        
        # Errores de aplicación
        application_exceptions = [
            'ValidationError', 'PermissionDenied', 'NotAuthenticated',
            'Http404', 'ValueError', 'KeyError', 'AttributeError'
        ]
        
        # Errores de cliente
        client_exceptions = [
            'ParseError', 'AuthenticationFailed', 'NotFound',
            'MethodNotAllowed', 'UnsupportedMediaType'
        ]
        
        if exception_type in critical_exceptions:
            severity = 'critical'
            category = 'system'
        elif exception_type in application_exceptions:
            severity = 'error'
            category = 'application'
        elif exception_type in client_exceptions:
            severity = 'warning'
            category = 'client'
        else:
            severity = 'error'
            category = 'unknown'
        
        return {
            'severity': severity,
            'category': category,
            'type': exception_type
        }
    
    def _create_api_error_response(self, exception, error_context, error_category):
        """
        Crea respuesta JSON de error para APIs
        
        Args:
            exception: Exception object
            error_context: Contexto del error
            error_category: Categoría del error
            
        Returns:
            JsonResponse: Respuesta de error estructurada
        """
        
        # Determinar código de estado HTTP
        status_code = self._get_http_status_code(exception, error_category)
        
        # Crear respuesta de error
        error_response = {
            'error': True,
            'message': self._get_user_friendly_message(exception, error_category),
            'code': error_category['type'],
            'timestamp': error_context['timestamp'],
            'request_id': error_context['request_id']
        }
        
        # Agregar detalles adicionales en modo debug
        if settings.DEBUG:
            error_response.update({
                'debug_info': {
                    'exception_type': error_category['type'],
                    'exception_message': str(exception),
                    'path': error_context['path'],
                    'method': error_context['method'],
                    'traceback': traceback.format_exc().split('\n') if settings.DEBUG else None
                }
            })
        
        return JsonResponse(
            error_response,
            status=status_code,
            json_dumps_params={'indent': 2 if settings.DEBUG else None}
        )
    
    def _get_http_status_code(self, exception, error_category):
        """
        Determina el código de estado HTTP apropiado
        
        Args:
            exception: Exception object
            error_category: Categoría del error
            
        Returns:
            int: Código de estado HTTP
        """
        
        exception_type = type(exception).__name__
        
        # Mapeo de excepciones a códigos HTTP
        status_mapping = {
            'ValidationError': 400,
            'ParseError': 400,
            'AuthenticationFailed': 401,
            'NotAuthenticated': 401,
            'PermissionDenied': 403,
            'NotFound': 404,
            'Http404': 404,
            'MethodNotAllowed': 405,
            'UnsupportedMediaType': 415,
            'DatabaseError': 500,
            'OperationalError': 500,
            'IntegrityError': 500,
            'RedisConnectionError': 503,
            'CeleryError': 503,
        }
        
        return status_mapping.get(exception_type, 500)
    
    def _get_user_friendly_message(self, exception, error_category):
        """
        Genera mensaje amigable para el usuario
        
        Args:
            exception: Exception object
            error_category: Categoría del error
            
        Returns:
            str: Mensaje amigable para el usuario
        """
        
        exception_type = type(exception).__name__
        
        # Mensajes amigables por tipo de excepción
        friendly_messages = {
            'ValidationError': 'Los datos proporcionados no son válidos. Por favor, verifique la información.',
            'AuthenticationFailed': 'Las credenciales proporcionadas no son válidas.',
            'NotAuthenticated': 'Se requiere autenticación para acceder a este recurso.',
            'PermissionDenied': 'No tiene permisos para realizar esta acción.',
            'NotFound': 'El recurso solicitado no fue encontrado.',
            'Http404': 'La página solicitada no existe.',
            'DatabaseError': 'Error interno del sistema. Por favor, inténtelo más tarde.',
            'OperationalError': 'Error interno del sistema. Por favor, inténtelo más tarde.',
            'RedisConnectionError': 'Servicio temporalmente no disponible. Por favor, inténtelo más tarde.',
            'CeleryError': 'Error procesando la solicitud. Por favor, inténtelo más tarde.',
        }
        
        # Si es modo debug, mostrar mensaje original
        if settings.DEBUG:
            return str(exception)
        
        # Si tenemos mensaje amigable, usarlo
        if exception_type in friendly_messages:
            return friendly_messages[exception_type]
        
        # Mensaje genérico según categoría
        if error_category['category'] == 'client':
            return 'Error en la solicitud. Por favor, verifique los datos enviados.'
        elif error_category['category'] == 'system':
            return 'Error interno del sistema. Por favor, inténtelo más tarde.'
        else:
            return 'Ha ocurrido un error. Por favor, inténtelo más tarde.'


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging de requests/responses
    """
    
    def process_request(self, request):
        """Log de requests entrantes"""
        
        # Solo log requests de API
        if request.path.startswith('/api/'):
            logger.info(
                f"API Request: {request.method} {request.path}",
                extra={
                    'request_data': {
                        'method': request.method,
                        'path': request.path,
                        'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
                        'user_email': getattr(request.user, 'email', None) if hasattr(request, 'user') else None,
                        'remote_addr': request.META.get('REMOTE_ADDR'),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'content_type': request.content_type,
                        'query_params': dict(request.GET) if request.GET else None,
                    }
                }
            )
    
    def process_response(self, request, response):
        """Log de responses"""
        
        # Solo log responses de API
        if request.path.startswith('/api/'):
            # Determinar nivel de log según status code
            if response.status_code >= 500:
                log_level = logging.ERROR
                log_message = f"API Error Response: {request.method} {request.path} - {response.status_code}"
            elif response.status_code >= 400:
                log_level = logging.WARNING
                log_message = f"API Client Error: {request.method} {request.path} - {response.status_code}"
            else:
                log_level = logging.INFO
                log_message = f"API Response: {request.method} {request.path} - {response.status_code}"
            
            logger.log(
                log_level,
                log_message,
                extra={
                    'response_data': {
                        'status_code': response.status_code,
                        'content_type': response.get('Content-Type', ''),
                        'content_length': len(response.content) if hasattr(response, 'content') else 0,
                    }
                }
            )
        
        return response
