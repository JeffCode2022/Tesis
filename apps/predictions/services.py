from django.core.cache import cache
from django.conf import settings
import joblib
import numpy as np
from .models import Prediction, ModelPerformance
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self):
        self.model = self._load_model()
        self.cache_ttl = settings.CACHE_TTL

    def _load_model(self):
        """Carga el modelo desde el archivo guardado"""
        try:
            model_path = settings.ML_MODELS_PATH / 'cardiovascular_model.joblib'
            if not model_path.exists():
                logger.warning("El modelo no está disponible. Se usará un modelo simulado.")
                return None
            return joblib.load(model_path)
        except Exception as e:
            logger.error(f"Error cargando el modelo: {str(e)}")
            return None

    def is_model_available(self):
        """Verifica si el modelo está disponible"""
        return self.model is not None

    def _get_cache_key(self, patient_id, medical_record_id):
        """Genera una clave única para el caché"""
        return f"prediction_{patient_id}_{medical_record_id}"

    def get_prediction(self, patient, medical_record):
        """Obtiene una predicción, usando caché si está disponible"""
        cache_key = self._get_cache_key(patient.id, medical_record.id)
        cached_prediction = cache.get(cache_key)

        if cached_prediction:
            return cached_prediction

        try:
            # Preparar datos para la predicción
            features = self._prepare_features(patient, medical_record)
            
            if not self.is_model_available():
                # Simular una predicción si el modelo no está disponible
                probability = 0.5  # Valor simulado
                risk_level = 'Medio'
            else:
                # Realizar predicción con el modelo real
                probability = self.model.predict_proba([features])[0][1]
                risk_level = self._determine_risk_level(probability)
            
            # Crear predicción
            prediction = Prediction.objects.create(
                patient=patient,
                medical_record=medical_record,
                riesgo_nivel=risk_level,
                probabilidad=probability * 100,
                factores_riesgo=self._analyze_risk_factors(features),
                recomendaciones=self._generate_recommendations(risk_level, features),
                scores_detallados=self._calculate_detailed_scores(features),
                confidence_score=self._calculate_confidence(features)
            )

            # Guardar en caché
            cache.set(cache_key, prediction, self.cache_ttl)
            
            return prediction

        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            raise

    def _prepare_features(self, patient, medical_record):
        """Prepara los features para el modelo"""
        # Implementar la lógica de preparación de features
        # Por ahora, retornamos un array de ceros como placeholder
        return np.zeros(10)  # Ajustar el tamaño según el modelo real

    def _determine_risk_level(self, probability):
        """Determina el nivel de riesgo basado en la probabilidad"""
        if probability < 0.3:
            return 'Bajo'
        elif probability < 0.7:
            return 'Medio'
        return 'Alto'

    def _analyze_risk_factors(self, features):
        """Analiza los factores de riesgo"""
        # Implementar análisis de factores de riesgo
        return ["Factor de riesgo simulado 1", "Factor de riesgo simulado 2"]

    def _generate_recommendations(self, risk_level, features):
        """Genera recomendaciones basadas en el nivel de riesgo"""
        # Implementar generación de recomendaciones
        return ["Recomendación simulado 1", "Recomendación simulado 2"]

    def _calculate_detailed_scores(self, features):
        """Calcula scores detallados por categoría"""
        # Implementar cálculo de scores detallados
        return {
            "categoria1": 0.5,
            "categoria2": 0.5
        }

    def _calculate_confidence(self, features):
        """Calcula el nivel de confianza de la predicción"""
        # Implementar cálculo de confianza
        return 0.8 if self.is_model_available() else 0.5

    def batch_predict(self, data_list):
        """Realiza predicciones en lote"""
        results = []
        for data in data_list:
            try:
                prediction = self.get_prediction(data['patient'], data['medical_record'])
                results.append(prediction)
            except Exception as e:
                logger.error(f"Error en predicción en lote: {str(e)}")
                results.append(None)
        return results

    def update_model_performance(self, predictions, actual_outcomes):
        """Actualiza las métricas de rendimiento del modelo"""
        try:
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
            
            y_pred = [1 if p.probabilidad > 50 else 0 for p in predictions]
            
            metrics = {
                'accuracy': accuracy_score(actual_outcomes, y_pred),
                'precision': precision_score(actual_outcomes, y_pred),
                'recall': recall_score(actual_outcomes, y_pred),
                'f1_score': f1_score(actual_outcomes, y_pred),
                'roc_auc': roc_auc_score(actual_outcomes, y_pred)
            }
            
            ModelPerformance.objects.create(
                model_version=self.model.version if hasattr(self.model, 'version') else 'v1.0.0',
                **metrics,
                total_predictions=len(predictions),
                correct_predictions=sum(1 for p, a in zip(y_pred, actual_outcomes) if p == a)
            )
            
        except Exception as e:
            logger.error(f"Error actualizando métricas: {str(e)}")
            raise 