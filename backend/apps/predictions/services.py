from django.core.cache import cache
from django.conf import settings
import joblib
import numpy as np
from .models import Prediction, ModelPerformance
from .validators import MedicalDataValidator, ValidationResult
import logging
from pathlib import Path
from ml_models.cardiovascular_predictor_clean import cardiovascular_predictor

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self):
        self.model = self._load_model()
        self.scaler = self._load_scaler()
        self.validator = MedicalDataValidator()
        self.cache_ttl = getattr(settings, 'CACHE_TTL', 300)

    def _load_model(self):
        """Carga el modelo desde el archivo guardado"""
        try:
            # Intentar cargar modelo mejorado primero
            model_path = Path(settings.ML_MODELS_PATH) / 'cardiovascular_model_improved.joblib'
            if not model_path.exists():
                # Fallback al modelo original
                model_path = Path(settings.ML_MODELS_PATH) / 'cardiovascular_model.joblib'
                if not model_path.exists():
                    logger.warning("El modelo no está disponible. Se usará un modelo simulado.")
                    return None
            logger.info(f"Cargando modelo desde: {model_path}")
            return joblib.load(model_path)
        except Exception as e:
            logger.error(f"Error cargando el modelo: {str(e)}")
            return None

    def _load_scaler(self):
        """Carga el scaler desde el archivo guardado"""
        try:
            # Intentar cargar scaler mejorado primero
            scaler_path = Path(settings.ML_MODELS_PATH) / 'scaler_improved.pkl'
            if not scaler_path.exists():
                # Fallback al scaler original
                scaler_path = Path(settings.ML_MODELS_PATH) / 'scaler.pkl'
                if not scaler_path.exists():
                    logger.warning("El scaler no está disponible. Se usará normalización básica.")
                    return None
            logger.info(f"Cargando scaler desde: {scaler_path}")
            return joblib.load(scaler_path)
        except Exception as e:
            logger.error(f"Error cargando el scaler: {str(e)}")
            return None

    def is_model_available(self):
        """Verifica si el modelo está disponible"""
        return self.model is not None

    def is_scaler_available(self):
        """Verifica si el scaler está disponible"""
        return self.scaler is not None

    def _get_cache_key(self, patient_id, medical_record_id):
        """Genera una clave única para el caché"""
        return f"prediction_{patient_id}_{medical_record_id}"

    def get_prediction(self, patient, medical_record):
        """Obtiene una predicción usando el predictor unificado"""
        try:
            # Usar el predictor unificado corregido
            prediction_result = cardiovascular_predictor.predict_cardiovascular_risk(medical_record)

            # Crear objeto Prediction con el resultado
            prediction = Prediction.objects.create(
                patient=patient,
                medical_record=medical_record,
                riesgo_nivel=prediction_result['riesgo_nivel'],
                probabilidad=prediction_result['probabilidad'],
                factores_riesgo=prediction_result.get('factores_riesgo', []),
                recomendaciones=prediction_result.get('recomendaciones', []),
                scores_detallados=prediction_result.get('scores_detallados', {}),
                confidence_score=prediction_result.get('confidence_score', 0.5),
                model_version=prediction_result.get('model_version', 'v1.0.0'),
                features_used=prediction_result.get('features_used', {})
            )

            logger.info(f"Predicción creada exitosamente para paciente {patient.id} usando predictor unificado")
            return prediction

        except Exception as e:
            logger.error(f"Error en predicción usando predictor unificado: {str(e)}")
            raise

    def predict_from_data(self, data_dict):
        """Hace una predicción usando datos directos con el predictor unificado"""
        try:
            # Crear un objeto MedicalRecord simulado a partir de los datos
            class MockPatient:
                def __init__(self, data):
                    self.sexo = data.get('sexo', 'M')
                    self.fecha_nacimiento = data.get('fecha_nacimiento')
                    self.imc = data.get('imc', 25.0)

            class MockMedicalRecord:
                def __init__(self, data):
                    self.patient = MockPatient(data)
                    self.presion_sistolica = data.get('presion_sistolica', 120)
                    self.presion_diastolica = data.get('presion_diastolica', 80)
                    self.colesterol_total = data.get('colesterol', 200)
                    self.glucosa = data.get('glucosa', 100)
                    self.indice_paquetes_ano = data.get('indice_paquetes', 0)
                    self.actividad_fisica = data.get('actividad_fisica', 'sedentario')
                    self.antecedentes_cardiacos = data.get('antecedentes_cardiacos', 'no')

            # Crear registro médico simulado
            mock_record = MockMedicalRecord(data_dict)

            # Usar el predictor unificado
            prediction_result = cardiovascular_predictor.predict_cardiovascular_risk(mock_record)

            # Formatear resultado para compatibilidad con el formato anterior
            return {
                'riesgo': prediction_result['riesgo_nivel'],
                'probabilidad': prediction_result['probabilidad'] / 100,  # Convertir de porcentaje a decimal
                'probabilidades': {
                    'bajo': prediction_result.get('prediction_probabilities', {}).get('BAJO', 0) / 100,
                    'medio': prediction_result.get('prediction_probabilities', {}).get('MEDIO', 0) / 100,
                    'alto': prediction_result.get('prediction_probabilities', {}).get('ALTO', 0) / 100
                },
                'clase_predicha': 0 if prediction_result['riesgo_nivel'] == 'BAJO' else 1 if prediction_result['riesgo_nivel'] == 'MEDIO' else 2,
                'numero_clases': 3
            }

        except Exception as e:
            logger.error(f"Error en predict_from_data usando predictor unificado: {str(e)}")
            # Fallback a resultado simulado
            return {
                'riesgo': 'Medio',
                'probabilidad': 0.5,
                'probabilidades': {'bajo': 0.2, 'medio': 0.5, 'alto': 0.3},
                'clase_predicha': 1,
                'numero_clases': 3
            }

    def _prepare_features_validated(self, patient, medical_record, validation_result: ValidationResult):
        """Prepara features con validación robusta y valores seguros"""
        try:
            # Calcular edad de forma segura
            from datetime import date
            if patient.fecha_nacimiento:
                today = date.today()
                age = today.year - patient.fecha_nacimiento.year - (
                    (today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day)
                )
            else:
                age = 0
                logger.warning("Fecha de nacimiento no disponible, usando edad 0")
            
            # Calcular IMC de forma segura
            if patient.peso and patient.altura and patient.altura > 0:
                imc = patient.peso / ((patient.altura / 100) ** 2)
            else:
                imc = 25.0  # Valor por defecto seguro
                logger.warning(f"Datos de peso/altura incompletos, usando IMC por defecto: {imc}")
            
            # Calcular índice de paquetes/año de forma segura
            if medical_record.anos_tabaquismo and medical_record.anos_tabaquismo > 0:
                indice_paquetes = (medical_record.cigarrillos_dia / 20) * medical_record.anos_tabaquismo
            else:
                indice_paquetes = 0
            
            # Mapear actividad física con validación
            actividad_mapping = {'sedentario': 0, 'ligero': 1, 'moderado': 2, 'intenso': 3}
            actividad_fisica = getattr(medical_record, 'actividad_fisica', 'sedentario')
            actividad_fisica_encoded = actividad_mapping.get(actividad_fisica, 0)
            
            # Codificar sexo con validación
            sexo_encoded = 1 if patient.sexo == 'M' else 0
            
            # Codificar antecedentes con validación
            antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0.5}
            antecedentes = getattr(medical_record, 'antecedentes_cardiacos', 'no')
            antecedentes_encoded = antecedentes_mapping.get(antecedentes, 0)
            
            # Usar valores por defecto seguros para datos faltantes
            safe_defaults = self.validator.get_safe_defaults(patient, medical_record)
            
            features = [
                age,
                imc,
                medical_record.presion_sistolica,
                medical_record.presion_diastolica,
                medical_record.colesterol or safe_defaults.get('colesterol', 180),
                medical_record.glucosa or safe_defaults.get('glucosa', 100),
                indice_paquetes,
                actividad_fisica_encoded,
                sexo_encoded,
                antecedentes_encoded
            ]
            
            features = np.array(features, dtype=np.float32)
            
            # Validación final de features
            if np.isnan(features).any():
                nan_indices = np.where(np.isnan(features))[0]
                raise ValueError(f"Features contienen NaN en posiciones: {nan_indices}")
            
            if np.isinf(features).any():
                inf_indices = np.where(np.isinf(features))[0]
                raise ValueError(f"Features contienen valores infinitos en posiciones: {inf_indices}")
            
            return features
            
        except Exception as e:
            logger.error(f"Error preparando features validados: {str(e)}")
            raise ValueError(f"Error al preparar los datos para la predicción: {str(e)}")

    def _prepare_features(self, patient, medical_record):
        """Prepara los features para el modelo, igual que en el entrenamiento"""
        try:
            # Calcular edad desde fecha de nacimiento
            from datetime import date
            if patient.fecha_nacimiento:
                today = date.today()
                age = today.year - patient.fecha_nacimiento.year - ((today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day))
            else:
                age = 0
            
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
                age,
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
        """Determina el nivel de riesgo basado en la probabilidad con umbrales REALES"""
        # Para modelo con clases [1, 2]: Medio y Alto
        if probability < 0.5:
            return 'Medio'
        else:
            return 'Alto'

    def _determine_risk_level_multiclass(self, predicted_class):
        """Devuelve el nivel de riesgo como string según la clase predicha"""
        # Para modelo con clases [1, 2]: 1=Medio, 2=Alto
        if predicted_class == 1:
            return 'Medio'
        elif predicted_class == 2:
            return 'Alto'
        else:
            # Fallback para otros casos
            return 'Medio'

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
            risk_factors.append(f"Obesidad (IMC: {imc:.1f} - Clase I)")
        elif imc >= 25:
            risk_factors.append(f"Sobrepeso (IMC: {imc:.1f})")
            
        # Análisis de presión arterial
        sistolica, diastolica = features[2], features[3]
        if sistolica >= 140 or diastolica >= 90:
            risk_factors.append(f"Presión arterial elevada ({int(sistolica)}/{int(diastolica)} mmHg)")
            
        # Análisis de colesterol
        colesterol = features[4]
        if colesterol >= 240:
            risk_factors.append(f"Colesterol muy elevado ({int(colesterol)} mg/dL)")
        elif colesterol >= 200:
            risk_factors.append(f"Colesterol límite alto ({int(colesterol)} mg/dL)")
            
        # Análisis de glucosa
        glucosa = features[5]
        if glucosa >= 126:
            risk_factors.append(f"Glucosa en rango de diabetes ({int(glucosa)} mg/dL)")
        elif glucosa >= 100:
            risk_factors.append(f"Glucosa en rango prediabético ({int(glucosa)} mg/dL)")
            
        # Análisis de tabaquismo
        paquetes_anio = features[6]
        if paquetes_anio > 20:
            risk_factors.append(f"Alto consumo de tabaco ({paquetes_anio:.1f} paquetes/año)")
        elif paquetes_anio > 0:
            risk_factors.append(f"Consumo de tabaco ({paquetes_anio:.1f} paquetes/año)")
            
        # Análisis de actividad física
        if features[7] <= 0.25:
            risk_factors.append("Estilo de vida sedentario")
            
        # Análisis de antecedentes
        if features[8] == 1:
            risk_factors.append("Antecedentes familiares de enfermedad cardíaca")
            
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
            
        if features[7] <= 0.25:
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
            "tabaquismo": self._calculate_smoking_score(features[6], 0),  # Solo índice de paquetes
            "actividad_fisica": self._calculate_activity_score(features[7]),
            "antecedentes": self._calculate_history_score(features[8])
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
        """Calcula la confianza basada en la calidad de los features"""
        if len(features) == 0:
            return 0.0
        # Confianza basada en la varianza de los features
        return max(0.5, min(0.99, 1.0 - np.var(features) / 100))
    
    def _analyze_risk_factors_validated(self, features, validation_result: ValidationResult):
        """Analiza factores de riesgo con información de validación"""
        risk_factors = self._analyze_risk_factors(features)
        
        # Agregar información sobre datos corregidos o advertencias
        if validation_result.warnings:
            risk_factors.append("Datos con advertencias de calidad")
        
        if validation_result.corrected_values:
            corrected_fields = ", ".join(validation_result.corrected_values.keys())
            risk_factors.append(f"Valores corregidos: {corrected_fields}")
        
        return risk_factors
    
    def _calculate_confidence_validated(self, features, validation_result: ValidationResult):
        """Calcula confianza considerando calidad de validación"""
        base_confidence = self._calculate_confidence(features)
        
        # Reducir confianza si hay advertencias
        warning_penalty = len(validation_result.warnings) * 0.05
        correction_penalty = len(validation_result.corrected_values) * 0.1
        
        adjusted_confidence = base_confidence - warning_penalty - correction_penalty
        
        return max(0.3, min(0.99, adjusted_confidence))

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

    def _calculate_age_from_date(self, birth_date, today):
        """Calcula la edad a partir de la fecha de nacimiento"""
        try:
            if isinstance(birth_date, str):
                from datetime import datetime
                birth_date = datetime.fromisoformat(birth_date).date()

            age = today.year - birth_date.year - (
                (today.month, today.day) < (birth_date.month, birth_date.day)
            )
            return max(0, age)  # Asegurar que la edad no sea negativa
        except Exception as e:
            logger.warning(f"Error calculando edad desde fecha {birth_date}: {str(e)}")
            return 50  # Valor por defecto razonable 