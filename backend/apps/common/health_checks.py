# 💚 NIVEL 1: Sistema de Health Checks Inteligentes
# Monitoreo completo del estado del sistema

import time
import logging
from typing import Dict, Any, List
from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection, connections
from django.conf import settings
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
import redis
import psycopg2

logger = logging.getLogger('cardiovascular.health')

class HealthCheckService:
    """Servicio centralizado para health checks del sistema."""
    
    def __init__(self):
        self.checks = {
            'database': self._check_database,
            'cache_redis': self._check_cache_redis,
            'cache_predictions': self._check_cache_predictions,
            'ml_models': self._check_ml_models,
            'disk_space': self._check_disk_space,
            'memory_usage': self._check_memory_usage,
            'celery_workers': self._check_celery_workers,
        }
    
    def run_all_checks(self) -> Dict[str, Any]:
        """Ejecuta todos los health checks y retorna el resultado."""
        start_time = time.time()
        results = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'checks': {},
            'overall_health_score': 0,
            'response_time_ms': 0
        }
        
        total_score = 0
        max_score = len(self.checks) * 100
        
        for check_name, check_func in self.checks.items():
            try:
                check_start = time.time()
                check_result = check_func()
                check_duration = (time.time() - check_start) * 1000
                
                results['checks'][check_name] = {
                    **check_result,
                    'duration_ms': round(check_duration, 2)
                }
                
                # Calcular score
                score = check_result.get('score', 0)
                total_score += score
                
                # Si algún check crítico falla, marcar como unhealthy
                if check_result.get('critical', False) and score < 50:
                    results['status'] = 'unhealthy'
                elif score < 70 and results['status'] == 'healthy':
                    results['status'] = 'degraded'
                    
            except Exception as e:
                logger.error(f"Health check {check_name} failed: {e}")
                results['checks'][check_name] = {
                    'status': 'error',
                    'message': str(e),
                    'score': 0,
                    'critical': True
                }
                results['status'] = 'unhealthy'
        
        results['overall_health_score'] = round((total_score / max_score) * 100, 1)
        results['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
        
        return results
    
    def _check_database(self) -> Dict[str, Any]:
        """Verifica el estado de la base de datos PostgreSQL."""
        try:
            start_time = time.time()
            
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
                
                # Verificar conexiones activas
                cursor.execute("""
                    SELECT count(*) as active_connections
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                """)
                active_connections = cursor.fetchone()[0]
                
                # Verificar tamaño de la base de datos
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
                """)
                db_size = cursor.fetchone()[0]
            
            query_time = (time.time() - start_time) * 1000
            
            # Calcular score basado en tiempo de respuesta y conexiones
            score = 100
            if query_time > 100:
                score -= 20
            if active_connections > 50:
                score -= 30
                
            return {
                'status': 'healthy' if score >= 70 else 'degraded',
                'message': f'Database responding in {query_time:.1f}ms',
                'score': score,
                'critical': True,
                'details': {
                    'query_time_ms': round(query_time, 2),
                    'active_connections': active_connections,
                    'database_size': db_size,
                    'connection_max_age': getattr(settings, 'CONN_MAX_AGE', 0)
                }
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Database connection failed: {str(e)}',
                'score': 0,
                'critical': True,
                'details': {'error': str(e)}
            }
    
    def _check_cache_redis(self) -> Dict[str, Any]:
        """Verifica el estado del cache Redis."""
        try:
            start_time = time.time()
            
            # Verificar cache principal
            cache.set('health_check', 'test_value', 10)
            retrieved_value = cache.get('health_check')
            cache.delete('health_check')
            
            if retrieved_value != 'test_value':
                raise Exception("Cache value mismatch")
            
            # Obtener estadísticas de Redis si está disponible
            try:
                from django_redis import get_redis_connection
                redis_conn = get_redis_connection("default")
                info = redis_conn.info()
                
                memory_usage = info.get('used_memory_human', 'Unknown')
                connected_clients = info.get('connected_clients', 0)
                keyspace_hits = info.get('keyspace_hits', 0)
                keyspace_misses = info.get('keyspace_misses', 0)
                
                hit_rate = 0
                if keyspace_hits + keyspace_misses > 0:
                    hit_rate = (keyspace_hits / (keyspace_hits + keyspace_misses)) * 100
                
            except Exception:
                memory_usage = 'Unknown'
                connected_clients = 0
                hit_rate = 0
            
            response_time = (time.time() - start_time) * 1000
            
            # Calcular score
            score = 100
            if response_time > 50:
                score -= 20
            if hit_rate < 70:
                score -= 15
            
            return {
                'status': 'healthy' if score >= 70 else 'degraded',
                'message': f'Redis responding in {response_time:.1f}ms',
                'score': score,
                'critical': False,
                'details': {
                    'response_time_ms': round(response_time, 2),
                    'memory_usage': memory_usage,
                    'connected_clients': connected_clients,
                    'cache_hit_rate_percent': round(hit_rate, 1)
                }
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Redis cache failed: {str(e)}',
                'score': 0,
                'critical': False,
                'details': {'error': str(e)}
            }
    
    def _check_cache_predictions(self) -> Dict[str, Any]:
        """Verifica el cache específico de predicciones."""
        try:
            from apps.predictions.cache_service import cache_service
            
            start_time = time.time()
            stats = cache_service.get_cache_stats()
            response_time = (time.time() - start_time) * 1000
            
            if stats.get('status') == 'error':
                raise Exception(stats.get('error', 'Unknown error'))
            
            return {
                'status': 'healthy',
                'message': f'Prediction cache service active',
                'score': 100,
                'critical': False,
                'details': {
                    'response_time_ms': round(response_time, 2),
                    'service_status': stats.get('cache_service_status'),
                    'backend': stats.get('default_cache_backend')
                }
            }
            
        except Exception as e:
            return {
                'status': 'degraded',
                'message': f'Prediction cache issues: {str(e)}',
                'score': 50,
                'critical': False,
                'details': {'error': str(e)}
            }
    
    def _check_ml_models(self) -> Dict[str, Any]:
        """Verifica el estado de los modelos de ML."""
        try:
            from apps.predictions.services import PredictionService
            
            service = PredictionService()
            
            # Verificar si el modelo está cargado
            model_loaded = hasattr(service, 'model') and service.model is not None
            scaler_loaded = hasattr(service, 'scaler') and service.scaler is not None
            
            score = 0
            if model_loaded:
                score += 50
            if scaler_loaded:
                score += 50
            
            status_msg = []
            if model_loaded:
                status_msg.append("Model loaded")
            else:
                status_msg.append("Model not loaded")
                
            if scaler_loaded:
                status_msg.append("Scaler loaded")
            else:
                status_msg.append("Scaler not loaded")
            
            return {
                'status': 'healthy' if score >= 70 else 'degraded',
                'message': ', '.join(status_msg),
                'score': score,
                'critical': False,
                'details': {
                    'model_loaded': model_loaded,
                    'scaler_loaded': scaler_loaded,
                    'service_class': service.__class__.__name__
                }
            }
            
        except Exception as e:
            return {
                'status': 'degraded',
                'message': f'ML models check failed: {str(e)}',
                'score': 30,  # Sistema puede funcionar con reglas médicas
                'critical': False,
                'details': {'error': str(e)}
            }
    
    def _check_disk_space(self) -> Dict[str, Any]:
        """Verifica el espacio disponible en disco."""
        try:
            import shutil
            
            # Verificar espacio en el directorio base
            total, used, free = shutil.disk_usage('/')
            
            # Convertir a GB
            total_gb = total // (1024**3)
            used_gb = used // (1024**3)
            free_gb = free // (1024**3)
            
            usage_percent = (used / total) * 100
            
            # Calcular score basado en espacio libre
            score = 100
            if usage_percent > 90:
                score = 20
            elif usage_percent > 80:
                score = 50
            elif usage_percent > 70:
                score = 70
            
            return {
                'status': 'healthy' if score >= 70 else 'degraded',
                'message': f'Disk usage at {usage_percent:.1f}%',
                'score': score,
                'critical': score < 30,
                'details': {
                    'total_gb': total_gb,
                    'used_gb': used_gb,
                    'free_gb': free_gb,
                    'usage_percent': round(usage_percent, 1)
                }
            }
            
        except Exception as e:
            return {
                'status': 'unknown',
                'message': f'Disk space check failed: {str(e)}',
                'score': 50,
                'critical': False,
                'details': {'error': str(e)}
            }
    
    def _check_memory_usage(self) -> Dict[str, Any]:
        """Verifica el uso de memoria del sistema."""
        try:
            import psutil
            
            memory = psutil.virtual_memory()
            usage_percent = memory.percent
            available_mb = memory.available // (1024**2)
            
            # Calcular score basado en uso de memoria
            score = 100
            if usage_percent > 95:
                score = 10
            elif usage_percent > 85:
                score = 40
            elif usage_percent > 75:
                score = 70
            
            return {
                'status': 'healthy' if score >= 70 else 'degraded',
                'message': f'Memory usage at {usage_percent:.1f}%',
                'score': score,
                'critical': score < 30,
                'details': {
                    'usage_percent': usage_percent,
                    'available_mb': available_mb,
                    'total_mb': memory.total // (1024**2)
                }
            }
            
        except ImportError:
            return {
                'status': 'unknown',
                'message': 'psutil not available for memory monitoring',
                'score': 80,
                'critical': False,
                'details': {'note': 'Install psutil for memory monitoring'}
            }
        except Exception as e:
            return {
                'status': 'unknown',
                'message': f'Memory check failed: {str(e)}',
                'score': 50,
                'critical': False,
                'details': {'error': str(e)}
            }
    
    def _check_celery_workers(self) -> Dict[str, Any]:
        """Verifica el estado de los workers de Celery."""
        try:
            from celery import current_app
            
            # Obtener estadísticas de workers activos
            inspect = current_app.control.inspect()
            stats = inspect.stats()
            active_tasks = inspect.active()
            
            if not stats:
                return {
                    'status': 'degraded',
                    'message': 'No Celery workers detected',
                    'score': 50,
                    'critical': False,
                    'details': {
                        'active_workers': 0,
                        'total_tasks': 0
                    }
                }
            
            active_workers = len(stats)
            total_active_tasks = sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0
            
            return {
                'status': 'healthy',
                'message': f'{active_workers} Celery workers active',
                'score': 100,
                'critical': False,
                'details': {
                    'active_workers': active_workers,
                    'active_tasks': total_active_tasks,
                    'worker_names': list(stats.keys())
                }
            }
            
        except Exception as e:
            return {
                'status': 'degraded',
                'message': f'Celery check failed: {str(e)}',
                'score': 70,  # Sistema puede funcionar sin Celery
                'critical': False,
                'details': {'error': str(e)}
            }

# Instancia global del servicio
health_service = HealthCheckService()

@never_cache
@require_http_methods(["GET"])
def health_check_view(request):
    """
    Endpoint principal de health check.
    
    Returns:
        - 200: Sistema saludable (score >= 70)
        - 503: Sistema degradado o no saludable (score < 70)
    """
    try:
        results = health_service.run_all_checks()
        
        # Determinar código de respuesta basado en el estado
        status_code = 200
        if results['status'] == 'unhealthy':
            status_code = 503
        elif results['status'] == 'degraded':
            status_code = 200  # Degraded pero aún funcional
        
        return JsonResponse(results, status=status_code)
        
    except Exception as e:
        logger.error(f"Health check endpoint failed: {e}")
        return JsonResponse({
            'status': 'error',
            'message': f'Health check system failure: {str(e)}',
            'timestamp': timezone.now().isoformat(),
            'overall_health_score': 0
        }, status=500)

@never_cache 
@require_http_methods(["GET"])
def ready_check_view(request):
    """
    Endpoint simplificado para verificar si el sistema está listo.
    Usado por load balancers y orchestrators.
    """
    try:
        # Verificar solo componentes críticos
        critical_checks = ['database']
        results = {}
        
        for check_name in critical_checks:
            if check_name in health_service.checks:
                results[check_name] = health_service.checks[check_name]()
        
        # Si todos los checks críticos pasan, sistema está listo
        all_critical_healthy = all(
            result.get('score', 0) >= 70 
            for result in results.values()
        )
        
        if all_critical_healthy:
            return JsonResponse({
                'status': 'ready',
                'timestamp': timezone.now().isoformat()
            })
        else:
            return JsonResponse({
                'status': 'not_ready',
                'timestamp': timezone.now().isoformat(),
                'critical_issues': [
                    name for name, result in results.items()
                    if result.get('score', 0) < 70
                ]
            }, status=503)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=500)
