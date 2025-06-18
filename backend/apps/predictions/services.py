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
        try:
            # Preparar datos para la predicción
            features = self._prepare_features(patient, medical_record)
            logger.info(f"Modelo disponible: {self.is_model_available()}")
            logger.info(f"Features usados para la predicción: {features}")

            if not self.is_model_available():
                logger.error("El modelo de predicción no está disponible. No se puede calcular la predicción real.")
                raise ValueError("El modelo de predicción no está disponible. No se puede calcular la predicción.")
            else:
                # Realizar predicción multiclase
                class_probs = self.model.predict_proba([features])[0]
                predicted_class = int(np.argmax(class_probs))
                probability = float(class_probs[predicted_class])
                risk_level = self._determine_risk_level_multiclass(predicted_class)
                logger.info(f"Clase predicha por el modelo: {predicted_class}, Probabilidad: {probability}, Riesgo: {risk_level}")

            # Crear predicción
            prediction = Prediction.objects.create(
                patient=patient,
                medical_record=medical_record,
                riesgo_nivel=risk_level,
                probabilidad=float(probability * 100),
                factores_riesgo=self._analyze_risk_factors(features),
                recomendaciones=self._generate_recommendations(risk_level, features),
                scores_detallados={k: float(v) for k, v in self._calculate_detailed_scores(features).items()},
                confidence_score=float(self._calculate_confidence(features))
            )

            logger.info(f"Predicción creada para paciente {patient.id}")
            return prediction

        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            raise

    def _prepare_features(self, patient, medical_record):
        """Prepara los features para el modelo, igual que en el entrenamiento"""
        try:
            # Calcular IMC
            imc = patient.peso / ((patient.altura / 100) ** 2) if patient.altura else 0
            # Calcular índice de paquetes/año
            indice_paquetes = (medical_record.cigarrillos_dia / 20) * medical_record.anos_tabaquismo if medical_record.anos_tabaquismo else 0
            # Codificar actividad física
            actividad_mapping = {'sedentario': 0, 'ligero': 1, 'moderado': 2, 'intenso': 3}
            actividad_fisica_encoded = actividad_mapping.get(medical_record.actividad_fisica, 0)
            # Codificar sexo
            sexo_encoded = 1 if patient.sexo == 'M' else 0
            # Codificar antecedentes
            antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0.5}
            antecedentes_encoded = antecedentes_mapping.get(medical_record.antecedentes_cardiacos, 0)

            features = [
                patient.edad,
                imc,
                medical_record.presion_sistolica,
                medical_record.presion_diastolica,
                medical_record.colesterol or 0,
                medical_record.glucosa or 0,
                indice_paquetes,
                actividad_fisica_encoded,
                sexo_encoded,
                antecedentes_encoded
            ]
            features = np.array(features, dtype=np.float32)
            if np.isnan(features).any() or np.isinf(features).any():
                raise ValueError("Los datos contienen valores inválidos (NaN o infinitos)")
            return features
        except Exception as e:
            logger.error(f"Error preparando features: {str(e)}")
            raise ValueError(f"Error al preparar los datos para la predicción: {str(e)}")

    def _determine_risk_level(self, probability):
        """Determina el nivel de riesgo basado en la probabilidad"""
        if probability < 0.3:
            return 'Bajo'
        elif probability < 0.7:
            return 'Medio'
        return 'Alto'

    def _determine_risk_level_multiclass(self, predicted_class):
        """Devuelve el nivel de riesgo como string según la clase predicha"""
        if predicted_class == 0:
            return 'Bajo'
        elif predicted_class == 1:
            return 'Medio'
        else:
            return 'Alto'

    def _analyze_risk_factors(self, features):
        """Analiza los factores de riesgo basado en los features"""
        risk_factors = []
        
        # Análisis de edad
        if features[0] > 65:
            risk_factors.append("Edad avanzada (>65 años)")
        elif features[0] > 45:
            risk_factors.append("Edad media (45-65 años)")
            
        # Análisis de IMC
        imc = features[1]
        if imc >= 30:
            risk_factors.append("Obesidad (IMC ≥ 30)")
        elif imc >= 25:
            risk_factors.append("Sobrepeso (IMC 25-29.9)")
            
        # Análisis de presión arterial
        if features[2] >= 140 or features[3] >= 90:
            risk_factors.append("Presión arterial elevada")
            
        # Análisis de colesterol
        if features[4] >= 200:
            risk_factors.append("Colesterol elevado")
            
        # Análisis de glucosa
        if features[5] >= 100:
            risk_factors.append("Glucosa elevada")
            
        # Análisis de tabaquismo
        if features[6] > 0:
            risk_factors.append(f"Tabaquismo: {features[6]} cigarrillos/día")
        if features[7] > 0:
            risk_factors.append(f"Años de tabaquismo: {features[7]}")
            
        # Análisis de actividad física
        if features[8] <= 0.25:
            risk_factors.append("Estilo de vida sedentario")
            
        # Análisis de antecedentes
        if features[9] == 1:
            risk_factors.append("Antecedentes cardíacos")
            
        return risk_factors

    def _generate_recommendations(self, risk_level, features):
        """Genera recomendaciones personalizadas basadas en el nivel de riesgo y los features"""
        recommendations = []
        
        # Recomendaciones generales según nivel de riesgo
        if risk_level == 'Alto':
            recommendations.extend([
                "Consultar con un cardiólogo lo antes posible",
                "Realizar ejercicio físico moderado bajo supervisión médica",
                "Mantener una dieta baja en grasas y sal"
            ])
        elif risk_level == 'Medio':
            recommendations.extend([
                "Realizar ejercicio físico regular",
                "Mantener una dieta balanceada",
                "Controlar el peso regularmente"
            ])
        else:
            recommendations.extend([
                "Mantener hábitos saludables",
                "Realizar ejercicio físico regular",
                "Mantener una dieta balanceada"
            ])
            
        # Recomendaciones específicas basadas en factores de riesgo
        if features[0] > 45:
            recommendations.append("Realizar chequeos médicos anuales")
            
        imc = features[1]
        if imc >= 25:
            recommendations.append("Consultar con un nutricionista para control de peso")
            
        if features[2] >= 140 or features[3] >= 90:
            recommendations.append("Controlar la presión arterial regularmente")
            
        if features[4] >= 200:
            recommendations.append("Reducir el consumo de grasas saturadas")
            
        if features[5] >= 100:
            recommendations.append("Controlar el consumo de azúcares")
            
        if features[6] > 0:
            recommendations.append("Considerar programas para dejar de fumar")
            
        if features[8] <= 0.25:
            recommendations.append("Aumentar la actividad física diaria")
            
        return recommendations

    def _calculate_detailed_scores(self, features):
        """Calcula scores detallados por categoría"""
        scores = {
            "edad": self._calculate_age_score(features[0]),
            "imc": self._calculate_imc_score(features[1]),
            "presion_arterial": self._calculate_bp_score(features[2], features[3]),
            "colesterol": self._calculate_cholesterol_score(features[4]),
            "glucosa": self._calculate_glucose_score(features[5]),
            "tabaquismo": self._calculate_smoking_score(features[6], features[7]),
            "actividad_fisica": self._calculate_activity_score(features[8]),
            "antecedentes": self._calculate_history_score(features[9])
        }
        return scores

    def _calculate_age_score(self, age):
        if age > 65: return 0.8
        elif age > 45: return 0.5
        return 0.2

    def _calculate_imc_score(self, imc):
        if imc >= 30: return 0.8
        elif imc >= 25: return 0.5
        return 0.2

    def _calculate_bp_score(self, systolic, diastolic):
        if systolic >= 140 or diastolic >= 90: return 0.8
        elif systolic >= 130 or diastolic >= 85: return 0.5
        return 0.2

    def _calculate_cholesterol_score(self, cholesterol):
        if cholesterol >= 200: return 0.8
        elif cholesterol >= 180: return 0.5
        return 0.2

    def _calculate_glucose_score(self, glucose):
        if glucose >= 100: return 0.8
        elif glucose >= 90: return 0.5
        return 0.2

    def _calculate_smoking_score(self, cigarettes, years):
        if cigarettes > 20 or years > 20: return 0.8
        elif cigarettes > 0 or years > 0: return 0.5
        return 0.2

    def _calculate_activity_score(self, activity):
        return activity  # Ya está normalizado entre 0.25 y 1

    def _calculate_history_score(self, history):
        return history  # Ya está normalizado entre 0 y 1

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