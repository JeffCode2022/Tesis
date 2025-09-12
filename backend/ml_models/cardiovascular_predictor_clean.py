#!/usr/bin/env python3
"""
Predictor cardiovascular actualizado para usar el modelo reentrenado
con datos más realistas
"""

import os
import joblib
import numpy as np
import pandas as pd
import logging
from django.conf import settings
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Any

logger = logging.getLogger('cardiovascular')

class CardiovascularPredictor:
    """
    Sistema de predicción cardiovascular integrado
    Soporta tanto modelos ML como sistema de reglas médicas
    """

    def __init__(self):
        # Priorizar modelos reentrenados con datos realistas
        self.model_candidates = [
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model_realistic.joblib'),  # Nuevo modelo reentrenado
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.pkl'),
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.joblib'),
        ]
        self.pipeline_path = os.path.join(settings.ML_MODELS_PATH, 'pipeline.joblib')
        self.scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler_realistic.pkl')  # Nuevo scaler

        # Features del modelo reentrenado
        self.feature_names = [
            'edad', 'imc', 'presion_sistolica', 'presion_diastolica',
            'colesterol', 'glucosa', 'indice_paquetes', 'actividad_fisica_encoded',
            'sexo_encoded', 'antecedentes_encoded'
        ]

        self.model = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        """Cargar modelos entrenados si existen"""
        try:
            # Priorizar modelo reentrenado con scaler
            model_path = None
            scaler_path = None

            # Buscar modelo reentrenado primero
            for candidate in self.model_candidates:
                if os.path.exists(candidate):
                    model_path = candidate
                    break

            # Buscar scaler correspondiente
            if 'realistic' in os.path.basename(model_path or ''):
                scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler_realistic.pkl')
            else:
                scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler.pkl')

            # Cargar modelo y scaler
            if model_path and os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info(f"Modelo reentrenado cargado: {os.path.basename(model_path)}")

                if os.path.exists(scaler_path):
                    self.scaler = joblib.load(scaler_path)
                    logger.info(f"Scaler cargado: {os.path.basename(scaler_path)}")
                else:
                    logger.warning("Scaler no encontrado, usando predicción sin normalización")
            else:
                logger.info("Modelo no encontrado, usando sistema de reglas médicas")

        except Exception as e:
            logger.error(f"Error cargando modelos: {e}")
            self.model = None
            self.scaler = None

    def predict_cardiovascular_risk(self, medical_record) -> Dict[str, Any]:
        """
        Predicción principal de riesgo cardiovascular
        """
        try:
            # Preparar features
            features = self._extract_features(medical_record)

            # Realizar predicción: si hay modelo (pipeline o modelo+scaler) usamos ML
            if self.model is not None:
                prediction_result = self._ml_prediction(features, medical_record)
            else:
                prediction_result = self._rule_based_prediction(features, medical_record)

            # Análisis adicional
            prediction_result['scores_detallados'] = self._calculate_detailed_scores(features, medical_record)

            logger.info(f"Predicción completada: {prediction_result['riesgo_nivel']} - {prediction_result['probabilidad']}%")

            return prediction_result

        except Exception as e:
            logger.error(f"Error en predicción cardiovascular: {e}")
            return self._default_prediction()

    def _extract_features(self, medical_record) -> Dict[str, float]:
        """Extraer y preparar features del registro médico para el modelo reentrenado"""
        patient = medical_record.patient

        # Calcular IMC
        imc = patient.imc or 25.0  # Valor por defecto

        # Calcular índice de paquetes/año
        indice_paquetes = medical_record.indice_paquetes_ano or 0.0

        # Calcular edad desde fecha de nacimiento
        from datetime import date
        if patient.fecha_nacimiento:
            today = date.today()
            edad = today.year - patient.fecha_nacimiento.year - ((today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day))
        else:
            edad = 30  # Valor por defecto

        # Codificar variables categóricas (0-1 encoding)
        sexo_encoded = 1 if patient.sexo == 'M' else 0

        antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0}
        antecedentes_encoded = antecedentes_mapping.get(medical_record.antecedentes_cardiacos, 0)

        # Mapear actividad física a encoding numérico
        actividad_mapping = {
            'sedentario': 0,
            'ligero': 1,
            'moderado': 2,
            'intenso': 3
        }
        actividad_fisica_encoded = actividad_mapping.get(medical_record.actividad_fisica, 1)

        # Features simplificadas para el modelo reentrenado
        features = {
            'edad': float(edad),
            'imc': float(imc),
            'presion_sistolica': float(medical_record.presion_sistolica or 120),
            'presion_diastolica': float(medical_record.presion_diastolica or 80),
            'colesterol': float(medical_record.colesterol or 200),  # Corregido: usar colesterol en lugar de colesterol_total
            'glucosa': float(medical_record.glucosa or 100),
            'indice_paquetes': float(indice_paquetes),
            'actividad_fisica_encoded': float(actividad_fisica_encoded),
            'sexo_encoded': float(sexo_encoded),
            'antecedentes_encoded': float(antecedentes_encoded)
        }

        return features

    def _ml_prediction(self, features: Dict[str, float], medical_record) -> Dict[str, Any]:
        """Realizar predicción usando modelo de machine learning"""
        try:
            # Preparar features en el orden correcto para el modelo
            feature_values = []
            for feature_name in self.feature_names:
                if feature_name in features:
                    feature_values.append(features[feature_name])
                else:
                    # Valor por defecto si falta alguna feature
                    feature_values.append(0.0)

            # Convertir a DataFrame con nombres de features para compatibilidad con scaler
            X_df = pd.DataFrame([feature_values], columns=self.feature_names)

            # Aplicar scaler si existe
            if self.scaler is not None:
                X_scaled = self.scaler.transform(X_df)
            else:
                X_scaled = X_df.values

            # Realizar predicción
            prediction_proba = self.model.predict_proba(X_scaled)[0]
            prediction = self.model.predict(X_scaled)[0]

            # Mapear predicción numérica a nivel de riesgo
            risk_levels = {0: 'BAJO', 1: 'MEDIO', 2: 'ALTO'}
            risk_level = risk_levels.get(prediction, 'MEDIO')

            # Calcular probabilidad del riesgo predicho
            risk_probability = prediction_proba[prediction] * 100

            # Análisis de factores de riesgo
            risk_factors = self._analyze_risk_factors_ml(features)

            # Recomendaciones basadas en el riesgo
            recommendations = self._generate_recommendations(risk_level, features)

            return {
                'riesgo_nivel': risk_level,
                'probabilidad': round(risk_probability, 1),
                'factores_riesgo': risk_factors,
                'recomendaciones': recommendations,
                'model_version': 'realistic_v1.0.0',
                'confidence_score': round(max(prediction_proba), 3),
                'features_used': features,
                'prediction_probabilities': {
                    'BAJO': round(prediction_proba[0] * 100, 1),
                    'MEDIO': round(prediction_proba[1] * 100, 1),
                    'ALTO': round(prediction_proba[2] * 100, 1)
                }
            }

        except Exception as e:
            logger.error(f"Error en predicción ML: {e}")
            # Fallback al sistema de reglas
            return self._rule_based_prediction(features, medical_record)

    def _rule_based_prediction(self, features: Dict[str, float], medical_record) -> Dict[str, Any]:
        """Sistema de predicción basado en reglas médicas cuando ML falla"""
        # Implementación básica de reglas médicas
        risk_score = 0
        risk_factors = []

        # Evaluar factores de riesgo
        if features['edad'] > 65:
            risk_score += 25
            risk_factors.append(f"Edad avanzada ({features['edad']:.0f} años)")
        elif features['edad'] > 45:
            risk_score += 15
            risk_factors.append(f"Edad media ({features['edad']:.0f} años)")

        if features['imc'] > 30:
            risk_score += 20
            risk_factors.append(f"Obesidad (IMC: {features['imc']:.1f})")
        elif features['imc'] > 25:
            risk_score += 10
            risk_factors.append(f"Sobrepeso (IMC: {features['imc']:.1f})")

        if features['presion_sistolica'] > 140 or features['presion_diastolica'] > 90:
            risk_score += 25
            risk_factors.append(f"Hipertensión ({features['presion_sistolica']:.0f}/{features['presion_diastolica']:.0f})")
        elif features['presion_sistolica'] > 130 or features['presion_diastolica'] > 80:
            risk_score += 15
            risk_factors.append(f"Presión elevada ({features['presion_sistolica']:.0f}/{features['presion_diastolica']:.0f})")

        if features['colesterol'] > 240:
            risk_score += 20
            risk_factors.append(f"Colesterol alto ({features['colesterol']:.0f})")
        elif features['colesterol'] > 200:
            risk_score += 10
            risk_factors.append(f"Colesterol borderline ({features['colesterol']:.0f})")

        if features['glucosa'] > 126:
            risk_score += 20
            risk_factors.append(f"Glucosa elevada ({features['glucosa']:.0f})")
        elif features['glucosa'] > 100:
            risk_score += 10
            risk_factors.append(f"Glucosa alterada ({features['glucosa']:.0f})")

        if features['indice_paquetes'] > 10:
            risk_score += 20
            risk_factors.append(f"Tabaquismo intenso ({features['indice_paquetes']:.1f} paquetes/año)")
        elif features['indice_paquetes'] > 0:
            risk_score += 10
            risk_factors.append(f"Tabaquismo ({features['indice_paquetes']:.1f} paquetes/año)")

        if features['antecedentes_encoded'] > 0:
            risk_score += 15
            risk_factors.append("Antecedentes cardíacos familiares")

        # Determinar nivel de riesgo
        if risk_score >= 40:
            risk_level = 'ALTO'
            probability = 85.0
        elif risk_score >= 20:
            risk_level = 'MEDIO'
            probability = 60.0
        else:
            risk_level = 'BAJO'
            probability = 25.0

        recommendations = self._generate_recommendations(risk_level, features)

        return {
            'riesgo_nivel': risk_level,
            'probabilidad': probability,
            'factores_riesgo': risk_factors,
            'recomendaciones': recommendations,
            'model_version': 'rules_fallback_v1.0.0',
            'confidence_score': 0.7,
            'features_used': features,
            'scores_detallados': {'total_score': risk_score}
        }

    def _analyze_risk_factors_ml(self, features: Dict[str, float]) -> List[str]:
        """Analizar factores de riesgo para predicción ML"""
        risk_factors = []

        # Edad
        if features['edad'] > 65:
            risk_factors.append(f"Edad avanzada ({features['edad']:.0f} años)")
        elif features['edad'] > 45:
            risk_factors.append(f"Edad media ({features['edad']:.0f} años)")

        # IMC
        if features['imc'] > 30:
            risk_factors.append(f"Obesidad (IMC: {features['imc']:.1f})")
        elif features['imc'] > 25:
            risk_factors.append(f"Sobrepeso (IMC: {features['imc']:.1f})")

        # Presión arterial
        if features['presion_sistolica'] > 140 or features['presion_diastolica'] > 90:
            risk_factors.append(f"Hipertensión ({features['presion_sistolica']:.0f}/{features['presion_diastolica']:.0f} mmHg)")
        elif features['presion_sistolica'] > 130 or features['presion_diastolica'] > 80:
            risk_factors.append(f"Presión elevada ({features['presion_sistolica']:.0f}/{features['presion_diastolica']:.0f} mmHg)")

        # Colesterol
        if features['colesterol'] > 240:
            risk_factors.append(f"Colesterol alto ({features['colesterol']:.0f} mg/dL)")
        elif features['colesterol'] > 200:
            risk_factors.append(f"Colesterol borderline ({features['colesterol']:.0f} mg/dL)")

        # Glucosa
        if features['glucosa'] > 126:
            risk_factors.append(f"Glucosa elevada ({features['glucosa']:.0f} mg/dL)")
        elif features['glucosa'] > 100:
            risk_factors.append(f"Glucosa alterada ({features['glucosa']:.0f} mg/dL)")

        # Tabaquismo
        if features['indice_paquetes'] > 10:
            risk_factors.append(f"Tabaquismo intenso ({features['indice_paquetes']:.1f} paquetes/año)")
        elif features['indice_paquetes'] > 0:
            risk_factors.append(f"Tabaquismo ({features['indice_paquetes']:.1f} paquetes/año)")

        # Actividad física
        if features['actividad_fisica_encoded'] < 1:
            risk_factors.append("Sedentarismo")

        # Antecedentes
        if features['antecedentes_encoded'] > 0:
            risk_factors.append("Antecedentes cardíacos familiares")

        return risk_factors

    def _generate_recommendations(self, risk_level: str, features: Dict[str, float]) -> List[str]:
        """Generar recomendaciones basadas en el nivel de riesgo"""
        recommendations = []

        if risk_level == 'ALTO':
            recommendations.extend([
                "Consulta cardiológica inmediata",
                "Exámenes cardíacos completos (ECG, ecocardiograma, pruebas de esfuerzo)",
                "Control estricto de factores de riesgo",
                "Posible inicio de tratamiento farmacológico"
            ])
        elif risk_level == 'MEDIO':
            recommendations.extend([
                "Consulta cardiológica en las próximas 4-6 semanas",
                "Exámenes de laboratorio básicos",
                "Modificación de estilo de vida",
                "Seguimiento regular de presión arterial y colesterol"
            ])
        else:  # BAJO
            recommendations.extend([
                "Mantener controles médicos regulares",
                "Estilo de vida saludable",
                "Prevención primaria",
                "Chequeos anuales"
            ])

        # Recomendaciones específicas basadas en factores de riesgo
        if features['imc'] > 25:
            recommendations.append("Control de peso y dieta saludable")
        if features['presion_sistolica'] > 130:
            recommendations.append("Control de presión arterial")
        if features['colesterol'] > 200:
            recommendations.append("Control de colesterol")
        if features['indice_paquetes'] > 0:
            recommendations.append("Dejar de fumar - programa de cesación tabáquica")
        if features['actividad_fisica_encoded'] < 2:
            recommendations.append("Aumentar actividad física (150 min/semana de ejercicio moderado)")

        return recommendations

    def _calculate_detailed_scores(self, features: Dict[str, float], medical_record) -> Dict[str, float]:
        """Calcular scores detallados para análisis adicional"""
        scores = {}

        # Score de edad
        if features['edad'] > 65:
            scores['edad'] = 3.0
        elif features['edad'] > 45:
            scores['edad'] = 2.0
        else:
            scores['edad'] = 1.0

        # Score de IMC
        if features['imc'] > 30:
            scores['imc'] = 3.0
        elif features['imc'] > 25:
            scores['imc'] = 2.0
        else:
            scores['imc'] = 1.0

        # Score de presión arterial
        if features['presion_sistolica'] > 140 or features['presion_diastolica'] > 90:
            scores['presion_arterial'] = 3.0
        elif features['presion_sistolica'] > 130 or features['presion_diastolica'] > 80:
            scores['presion_arterial'] = 2.0
        else:
            scores['presion_arterial'] = 1.0

        # Score de colesterol
        if features['colesterol'] > 240:
            scores['colesterol'] = 3.0
        elif features['colesterol'] > 200:
            scores['colesterol'] = 2.0
        else:
            scores['colesterol'] = 1.0

        # Score de glucosa
        if features['glucosa'] > 126:
            scores['glucosa'] = 3.0
        elif features['glucosa'] > 100:
            scores['glucosa'] = 2.0
        else:
            scores['glucosa'] = 1.0

        return scores

    def _default_prediction(self) -> Dict[str, Any]:
        """Predicción por defecto en caso de error"""
        return {
            'riesgo_nivel': "Medio",
            'probabilidad': 50.0,
            'factores_riesgo': ["Evaluación pendiente - Error en el sistema"],
            'recomendaciones': [
                "Consulta médica para evaluación completa",
                "Exámenes de laboratorio básicos",
                "Control de presión arterial",
                "Evaluación cardiológica si persisten síntomas"
            ],
            'model_version': 'fallback_v1.0.0',
            'confidence_score': 0.5,
            'features_used': {},
            'scores_detallados': {}
        }

# Instancia global del predictor
cardiovascular_predictor = CardiovascularPredictor()
