# 🔄 Sistema de Cache Avanzado para Predicciones
# Optimización NIVEL 2: Cache inteligente con invalidación automática

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, List
from django.core.cache import cache, caches
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

class PredictionCacheService:
    """Servicio de cache inteligente para predicciones cardiovasculares."""
    
    # Cache timeouts (en segundos)
    PREDICTION_TIMEOUT = 1800  # 30 minutos
    PATIENT_TIMEOUT = 600      # 10 minutos
    STATISTICS_TIMEOUT = 3600  # 1 hora
    ML_MODEL_TIMEOUT = 7200    # 2 horas
    
    # Prefijos de cache
    PREDICTION_PREFIX = "pred"
    PATIENT_PREFIX = "patient"
    STATS_PREFIX = "stats"
    MODEL_PREFIX = "ml_model"
    
    def __init__(self):
        """Inicializa el servicio de cache con configuración optimizada."""
        try:
            self.prediction_cache = caches['predictions']
            self.default_cache = cache
            logger.info("Cache service initialized successfully")
        except Exception as e:
            logger.warning(f"Cache initialization failed, using default: {e}")
            self.prediction_cache = cache
            self.default_cache = cache
    
    def _generate_cache_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """Genera una clave de cache única basada en los datos de entrada."""
        # Ordenar datos para consistencia
        sorted_data = json.dumps(data, sort_keys=True, default=str)
        hash_value = hashlib.md5(sorted_data.encode()).hexdigest()[:12]
        return f"{prefix}:{hash_value}"
    
    def get_prediction_cache(self, medical_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Obtiene una predicción del cache.
        
        Args:
            medical_data: Datos médicos para la predicción
            
        Returns:
            Resultado de predicción cacheado o None si no existe
        """
        try:
            cache_key = self._generate_cache_key(self.PREDICTION_PREFIX, medical_data)
            cached_result = self.prediction_cache.get(cache_key)
            
            if cached_result:
                # Verificar si el cache no ha expirado según criterios personalizados
                cache_time = cached_result.get('cached_at')
                if cache_time:
                    cache_age = timezone.now() - datetime.fromisoformat(cache_time)
                    if cache_age.total_seconds() < self.PREDICTION_TIMEOUT:
                        logger.info(f"Cache hit for prediction: {cache_key[:8]}...")
                        cached_result['from_cache'] = True
                        return cached_result
                    else:
                        logger.info(f"Cache expired for prediction: {cache_key[:8]}...")
                        self.prediction_cache.delete(cache_key)
            
            logger.info(f"Cache miss for prediction: {cache_key[:8]}...")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving prediction from cache: {e}")
            return None
    
    def set_prediction_cache(self, medical_data: Dict[str, Any], result: Dict[str, Any]) -> bool:
        """
        Guarda una predicción en el cache.
        
        Args:
            medical_data: Datos médicos utilizados
            result: Resultado de la predicción
            
        Returns:
            True si se guardó correctamente, False en caso contrario
        """
        try:
            cache_key = self._generate_cache_key(self.PREDICTION_PREFIX, medical_data)
            
            # Enriquecer resultado con metadatos de cache
            enriched_result = {
                **result,
                'cached_at': timezone.now().isoformat(),
                'cache_key': cache_key,
                'medical_data_hash': hashlib.md5(
                    json.dumps(medical_data, sort_keys=True).encode()
                ).hexdigest()[:8]
            }
            
            # Guardar con timeout personalizado basado en el riesgo
            risk_level = result.get('risk_level', 'medium')
            timeout = self._get_dynamic_timeout(risk_level)
            
            success = self.prediction_cache.set(cache_key, enriched_result, timeout)
            
            if success:
                logger.info(f"Prediction cached successfully: {cache_key[:8]}... (timeout: {timeout}s)")
            else:
                logger.warning(f"Failed to cache prediction: {cache_key[:8]}...")
            
            return success
            
        except Exception as e:
            logger.error(f"Error caching prediction: {e}")
            return False
    
    def get_patient_cache(self, patient_id: int) -> Optional[Dict[str, Any]]:
        """Obtiene datos de paciente del cache."""
        try:
            cache_key = f"{self.PATIENT_PREFIX}:{patient_id}"
            cached_data = self.default_cache.get(cache_key)
            
            if cached_data:
                logger.info(f"Patient cache hit: {patient_id}")
                return cached_data
            
            logger.info(f"Patient cache miss: {patient_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving patient from cache: {e}")
            return None
    
    def set_patient_cache(self, patient_id: int, patient_data: Dict[str, Any]) -> bool:
        """Guarda datos de paciente en el cache."""
        try:
            cache_key = f"{self.PATIENT_PREFIX}:{patient_id}"
            
            # Agregar timestamp para invalidación inteligente
            enriched_data = {
                **patient_data,
                'cached_at': timezone.now().isoformat(),
                'patient_id': patient_id
            }
            
            success = self.default_cache.set(cache_key, enriched_data, self.PATIENT_TIMEOUT)
            
            if success:
                logger.info(f"Patient cached successfully: {patient_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error caching patient data: {e}")
            return False
    
    def get_statistics_cache(self, stats_type: str, filters: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Obtiene estadísticas del cache."""
        try:
            filter_key = self._generate_cache_key("filters", filters or {})
            cache_key = f"{self.STATS_PREFIX}:{stats_type}:{filter_key}"
            
            cached_stats = self.default_cache.get(cache_key)
            
            if cached_stats:
                logger.info(f"Statistics cache hit: {stats_type}")
                return cached_stats
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving statistics from cache: {e}")
            return None
    
    def set_statistics_cache(self, stats_type: str, stats_data: Dict[str, Any], 
                           filters: Dict[str, Any] = None) -> bool:
        """Guarda estadísticas en el cache."""
        try:
            filter_key = self._generate_cache_key("filters", filters or {})
            cache_key = f"{self.STATS_PREFIX}:{stats_type}:{filter_key}"
            
            enriched_stats = {
                **stats_data,
                'generated_at': timezone.now().isoformat(),
                'stats_type': stats_type,
                'applied_filters': filters
            }
            
            success = self.default_cache.set(cache_key, enriched_stats, self.STATISTICS_TIMEOUT)
            
            if success:
                logger.info(f"Statistics cached successfully: {stats_type}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error caching statistics: {e}")
            return False
    
    def invalidate_patient_cache(self, patient_id: int) -> bool:
        """Invalida el cache de un paciente específico."""
        try:
            cache_key = f"{self.PATIENT_PREFIX}:{patient_id}"
            self.default_cache.delete(cache_key)
            logger.info(f"Patient cache invalidated: {patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating patient cache: {e}")
            return False
    
    def invalidate_prediction_cache(self, medical_data: Dict[str, Any]) -> bool:
        """Invalida cache de predicción específica."""
        try:
            cache_key = self._generate_cache_key(self.PREDICTION_PREFIX, medical_data)
            self.prediction_cache.delete(cache_key)
            logger.info(f"Prediction cache invalidated: {cache_key[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating prediction cache: {e}")
            return False
    
    def clear_all_cache(self) -> bool:
        """Limpia todo el cache (usar con precaución)."""
        try:
            self.default_cache.clear()
            self.prediction_cache.clear()
            logger.warning("All caches cleared")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del cache."""
        try:
            # Simulación de estadísticas (Redis real proporcionaría más detalles)
            return {
                'cache_service_status': 'active',
                'default_cache_backend': str(self.default_cache.__class__.__name__),
                'prediction_cache_backend': str(self.prediction_cache.__class__.__name__),
                'timestamp': timezone.now().isoformat(),
                'timeouts': {
                    'predictions': self.PREDICTION_TIMEOUT,
                    'patients': self.PATIENT_TIMEOUT,
                    'statistics': self.STATISTICS_TIMEOUT,
                    'ml_models': self.ML_MODEL_TIMEOUT
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'error': str(e), 'status': 'error'}
    
    def _get_dynamic_timeout(self, risk_level: str) -> int:
        """Calcula timeout dinámico basado en nivel de riesgo."""
        risk_multipliers = {
            'low': 0.5,      # Cache más tiempo para bajo riesgo
            'medium': 1.0,   # Timeout estándar
            'high': 2.0,     # Cache menos tiempo para alto riesgo
            'critical': 3.0  # Cache muy poco tiempo para crítico
        }
        
        multiplier = risk_multipliers.get(risk_level.lower(), 1.0)
        return int(self.PREDICTION_TIMEOUT * multiplier)

# Instancia global del servicio
cache_service = PredictionCacheService()
