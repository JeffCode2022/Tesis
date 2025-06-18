import os
import joblib
import numpy as np
import pandas as pd
import logging
from django.conf import settings
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger('ml_models')

class CardiovascularMLService:
    def __init__(self):
        self.model_path = os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.pkl')
        self.scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler.pkl')
        self.feature_names = [
            'edad', 'imc', 'presion_sistolica', 'presion_diastolica',
            'colesterol', 'glucosa', 'indice_paquetes', 'actividad_fisica_encoded',
            'sexo_encoded', 'antecedentes_encoded'
        ]
        
        self.model = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        """Cargar modelos entrenados"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Modelo cardiovascular cargado exitosamente")
            else:
                logger.warning("Modelo no encontrado, usando predicción por reglas")
                
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Scaler cargado exitosamente")
            else:
                logger.warning("Scaler no encontrado, usando normalización básica")
                
        except Exception as e:
            logger.error(f"Error cargando modelos: {e}")
            self.model = None
            self.scaler = None

    def predict(self, medical_record):
        """Realizar predicción de riesgo cardiovascular"""
        try:
            # Preparar features
            features = self._prepare_features(medical_record)
            
            if self.model and self.scaler:
                # Usar modelo ML entrenado
                return self._ml_prediction(features, medical_record)
            else:
                # Usar sistema de reglas como fallback
                return self._rule_based_prediction(features, medical_record)
                
        except Exception as e:
            logger.error(f"Error en predicción: {e}")
            return self._default_prediction(medical_record)

    def _prepare_features(self, medical_record):
        """Preparar features para el modelo"""
        patient = medical_record.patient
        
        # Calcular IMC
        altura_m = patient.altura / 100
        imc = patient.peso / (altura_m ** 2)
        
        # Calcular índice de paquetes/año
        indice_paquetes = 0
        if medical_record.cigarrillos_dia > 0 and medical_record.anos_tabaquismo > 0:
            indice_paquetes = (medical_record.cigarrillos_dia / 20) * medical_record.anos_tabaquismo
        
        # Codificar variables categóricas
        actividad_mapping = {'sedentario': 0, 'ligero': 1, 'moderado': 2, 'intenso': 3}
        actividad_encoded = actividad_mapping.get(medical_record.actividad_fisica, 0)
        
        sexo_encoded = 1 if patient.sexo == 'M' else 0
        
        antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0.5}
        antecedentes_encoded = antecedentes_mapping.get(medical_record.antecedentes_cardiacos, 0)
        
        features = {
            'edad': patient.edad,
            'imc': imc,
            'presion_sistolica': medical_record.presion_sistolica,
            'presion_diastolica': medical_record.presion_diastolica,
            'colesterol': medical_record.colesterol or 200,  # Valor por defecto
            'glucosa': medical_record.glucosa or 100,
            'indice_paquetes': indice_paquetes,
            'actividad_fisica_encoded': actividad_encoded,
            'sexo_encoded': sexo_encoded,
            'antecedentes_encoded': antecedentes_encoded
        }
        
        return features

    def _ml_prediction(self, features, medical_record):
        """Predicción usando modelo ML"""
        try:
            # Convertir a array numpy
            feature_array = np.array([list(features.values())])
            
            # Normalizar
            if self.scaler:
                feature_array = self.scaler.transform(feature_array)
            
            # Predicción
            probability = self.model.predict_proba(feature_array)[0][1]
            confidence = np.max(self.model.predict_proba(feature_array)[0])
            
            # Determinar nivel de riesgo
            risk_level = self._get_risk_level(probability * 100)
            
            # Análisis de factores de riesgo
            risk_factors = self._analyze_risk_factors(medical_record, features)
            recommendations = self._generate_recommendations(risk_factors, risk_level)
            
            return {
                'riesgo_nivel': risk_level,
                'probabilidad': float(probability * 100),
                'factores_riesgo': risk_factors,
                'recomendaciones': recommendations,
                'model_version': 'v1.2.0',
                'confidence_score': float(confidence),
                'features_used': features
            }
            
        except Exception as e:
            logger.error(f"Error en predicción ML: {e}")
            return self._rule_based_prediction(features, medical_record)

    def _rule_based_prediction(self, features, medical_record):
        """Sistema de predicción basado en reglas médicas"""
        risk_score = 0
        risk_factors = []
        
        # Evaluación por edad
        if features['edad'] > 65:
            risk_score += 25
            risk_factors.append("Edad avanzada (>65 años)")
        elif features['edad'] > 45:
            risk_score += 15
            risk_factors.append("Edad de riesgo (45-65 años)")
        
        # Evaluación IMC
        if features['imc'] > 30:
            risk_score += 20
            risk_factors.append("Obesidad (IMC > 30)")
        elif features['imc'] > 25:
            risk_score += 10
            risk_factors.append("Sobrepeso (IMC 25-30)")
        
        # Evaluación presión arterial
        if features['presion_sistolica'] > 140:
            risk_score += 25
            risk_factors.append("Hipertensión arterial")
        elif features['presion_sistolica'] > 120:
            risk_score += 15
            risk_factors.append("Presión arterial elevada")
        
        # Evaluación colesterol
        if features['colesterol'] > 240:
            risk_score += 15
            risk_factors.append("Colesterol elevado")
        elif features['colesterol'] > 200:
            risk_score += 8
            risk_factors.append("Colesterol borderline")
        
        # Evaluación glucosa
        if features['glucosa'] > 126:
            risk_score += 20
            risk_factors.append("Diabetes mellitus")
        elif features['glucosa'] > 100:
            risk_score += 10
            risk_factors.append("Glucosa elevada")
        
        # Evaluación tabaquismo
        if features['indice_paquetes'] > 20:
            risk_score += 25
            risk_factors.append("Tabaquismo severo")
        elif features['indice_paquetes'] > 10:
            risk_score += 15
            risk_factors.append("Tabaquismo moderado")
        elif features['indice_paquetes'] > 0:
            risk_score += 10
            risk_factors.append("Consumo de tabaco")
        
        # Evaluación actividad física
        if features['actividad_fisica_encoded'] == 0:  # sedentario
            risk_score += 10
            risk_factors.append("Sedentarismo")
        
        # Evaluación antecedentes familiares
        if features['antecedentes_encoded'] == 1:
            risk_score += 15
            risk_factors.append("Antecedentes familiares cardiovasculares")
        
        # Evaluación por sexo y edad combinados
        if features['sexo_encoded'] == 1 and features['edad'] > 45:  # Hombre > 45
            risk_score += 10
        elif features['sexo_encoded'] == 0 and features['edad'] > 55:  # Mujer > 55
            risk_score += 10
        
        # Determinar nivel de riesgo
        risk_level = self._get_risk_level(min(risk_score, 95))
        recommendations = self._generate_recommendations(risk_factors, risk_level)
        
        return {
            'riesgo_nivel': risk_level,
            'probabilidad': float(min(risk_score, 95)),
            'factores_riesgo': risk_factors,
            'recomendaciones': recommendations,
            'model_version': 'rules_v1.0.0',
            'confidence_score': 0.85,
            'features_used': features
        }

    def _get_risk_level(self, probability):
        """Determinar nivel de riesgo basado en probabilidad"""
        if probability < 30:
            return "Bajo"
        elif probability < 60:
            return "Medio"
        else:
            return "Alto"

    def _analyze_risk_factors(self, medical_record, features):
        """Analizar factores de riesgo específicos"""
        risk_factors = []
        
        # Análisis detallado de cada factor
        if features['imc'] > 30:
            risk_factors.append(f"IMC elevado ({features['imc']:.1f}) - Obesidad")
        elif features['imc'] > 25:
            risk_factors.append(f"IMC elevado ({features['imc']:.1f}) - Sobrepeso")
        
        if features['presion_sistolica'] > 140:
            risk_factors.append(f"Hipertensión arterial ({features['presion_sistolica']}/{features['presion_diastolica']} mmHg)")
        
        if features['colesterol'] > 240:
            risk_factors.append(f"Colesterol muy elevado ({features['colesterol']} mg/dL)")
        elif features['colesterol'] > 200:
            risk_factors.append(f"Colesterol elevado ({features['colesterol']} mg/dL)")
        
        if features['indice_paquetes'] > 0:
            risk_factors.append(f"Tabaquismo ({features['indice_paquetes']:.1f} paquetes/año)")
        
        if features['actividad_fisica_encoded'] == 0:
            risk_factors.append("Sedentarismo")
        
        if features['antecedentes_encoded'] == 1:
            risk_factors.append("Antecedentes familiares cardiovasculares")
        
        return risk_factors

    def _generate_recommendations(self, risk_factors, risk_level):
        """Generar recomendaciones personalizadas"""
        recommendations = []
        
        if risk_level == "Alto":
            recommendations.append("🚨 Consulta cardiológica URGENTE")
            recommendations.append("📊 Evaluación completa con electrocardiograma y ecocardiograma")
            recommendations.append("💊 Considerar medicación antihipertensiva y estatinas")
        
        if risk_level in ["Alto", "Medio"]:
            recommendations.append("🏥 Control médico cada 3-6 meses")
            recommendations.append("📈 Monitoreo regular de presión arterial")
        
        # Recomendaciones específicas por factor de riesgo
        if any("IMC" in factor for factor in risk_factors):
            recommendations.append("🥗 Consulta nutricional para plan de pérdida de peso")
            recommendations.append("⚖️ Objetivo: reducir 5-10% del peso corporal")
        
        if any("Hipertensión" in factor for factor in risk_factors):
            recommendations.append("🧂 Dieta baja en sodio (<2g/día)")
            recommendations.append("💊 Medicación antihipertensiva según criterio médico")
        
        if any("Colesterol" in factor for factor in risk_factors):
            recommendations.append("🐟 Dieta rica en omega-3 y baja en grasas saturadas")
            recommendations.append("💊 Considerar estatinas según criterio médico")
        
        if any("Tabaquismo" in factor for factor in risk_factors):
            recommendations.append("🚭 Programa de cesación tabáquica INMEDIATO")
            recommendations.append("🫁 Evaluación de función pulmonar")
        
        if any("Sedentarismo" in factor for factor in risk_factors):
            recommendations.append("🏃‍♂️ Ejercicio aeróbico 150 min/semana")
            recommendations.append("💪 Ejercicios de resistencia 2-3 veces/semana")
        
        # Recomendaciones generales
        recommendations.extend([
            "🥬 Dieta mediterránea rica en frutas y verduras",
            "😴 Dormir 7-8 horas diarias",
            "🧘‍♀️ Técnicas de manejo del estrés",
            "📱 Monitoreo domiciliario de presión arterial"
        ])
        
        return recommendations

    def _default_prediction(self, medical_record):
        """Predicción por defecto en caso de error"""
        return {
            'riesgo_nivel': "Medio",
            'probabilidad': 50.0,
            'factores_riesgo': ["Evaluación pendiente"],
            'recomendaciones': [
                "Consulta médica para evaluación completa",
                "Exámenes de laboratorio básicos",
                "Control de presión arterial"
            ],
            'model_version': 'default_v1.0.0',
            'confidence_score': 0.5,
            'features_used': {}
        }
