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
        # Aceptar tanto .pkl como .joblib para máxima compatibilidad con modelos entrenados
        # Priorizar modelos reentrenados con datos realistas
        self.model_candidates = [
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model_realistic.joblib'),  # Nuevo modelo reentrenado
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.pkl'),
            os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.joblib'),
        ]
        self.pipeline_path = os.path.join(settings.ML_MODELS_PATH, 'pipeline.joblib')
        self.scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler_realistic.pkl')  # Nuevo scaler
        
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
            # Preferir pipeline unificado si existe
            if os.path.exists(self.pipeline_path):
                self.model = joblib.load(self.pipeline_path)
                self.scaler = None  # Ya está dentro del pipeline
                logger.info("Pipeline de modelo cargado exitosamente (pipeline.joblib)")
            else:
                # Buscar el primer modelo existente de la lista de candidatos
                model_path = next((p for p in self.model_candidates if os.path.exists(p)), None)
                if model_path:
                    self.model = joblib.load(model_path)
                    logger.info(f"Modelo cardiovascular cargado exitosamente desde: {os.path.basename(model_path)}")
                else:
                    logger.info("Modelo no encontrado (.pkl/.joblib), usando sistema de reglas médicas")
                
            # Cargar scaler solo si NO usamos pipeline
            if self.model is not None and not os.path.exists(self.pipeline_path):
                if os.path.exists(self.scaler_path):
                    self.scaler = joblib.load(self.scaler_path)
                    logger.info("Scaler cargado exitosamente")
                
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
            'colesterol': float(medical_record.colesterol_total or 200),
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

            # Convertir a numpy array
            X = np.array([feature_values])

            # Aplicar scaler si existe
            if self.scaler is not None:
                X_scaled = self.scaler.transform(X)
            else:
                X_scaled = X

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

    def _describe_risk_factor(self, feature_name: str, value: float) -> str:
        """Describir factor de riesgo basado en el nombre y valor"""
        descriptions = {
            'edad': f"Edad: {value:.0f} años" if value > 45 else None,
            'imc': f"IMC elevado: {value:.1f}" if value > 25 else None,
            'presion_sistolica': f"Presión sistólica: {value:.0f} mmHg" if value > 130 else None,
            'presion_diastolica': f"Presión diastólica: {value:.0f} mmHg" if value > 80 else None,
            'colesterol': f"Colesterol: {value:.0f} mg/dL" if value > 200 else None,
            'glucosa': f"Glucosa: {value:.0f} mg/dL" if value > 100 else None,
            'indice_paquetes': f"Tabaquismo: {value:.1f} paquetes/año" if value > 0 else None,
        }

        return descriptions.get(feature_name)

    def _describe_risk_factor(self, feature_name: str, value: float) -> str:
        
        detailed_scores['presion_arterial'] = bp_score
        risk_score += bp_score
        
        # 3. EVALUACIÓN DE COLESTEROL
        chol_score = 0
        colesterol_total = features['colesterol_total']
        hdl = features['colesterol_hdl']
        ldl = features['colesterol_ldl']
        
        if colesterol_total >= 240:
            chol_score += 15
            risk_factors.append(f"Colesterol total muy alto ({colesterol_total} mg/dL)")
        elif colesterol_total >= 200:
            chol_score += 8
            risk_factors.append(f"Colesterol total elevado ({colesterol_total} mg/dL)")
        
        if hdl < 40:
            chol_score += 10
            risk_factors.append(f"HDL bajo ({hdl} mg/dL)")
        
        if ldl >= 160:
            chol_score += 15
            risk_factors.append(f"LDL muy alto ({ldl} mg/dL)")
        elif ldl >= 130:
            chol_score += 10
            risk_factors.append(f"LDL alto ({ldl} mg/dL)")
        
        detailed_scores['colesterol'] = chol_score
        risk_score += chol_score
        
        # 4. EVALUACIÓN DE DIABETES/GLUCOSA
        diabetes_score = 0
        if features['diabetes_encoded'] or features['hba1c'] >= 6.5:
            diabetes_score = 25
            risk_factors.append("Diabetes mellitus")
        elif features['glucosa'] >= 126 or features['hba1c'] >= 6.0:
            diabetes_score = 15
            risk_factors.append("Prediabetes")
        elif features['glucosa'] >= 100:
            diabetes_score = 5
            risk_factors.append("Glucosa alterada en ayunas")
        
        detailed_scores['diabetes'] = diabetes_score
        risk_score += diabetes_score
        
        # 5. EVALUACIÓN DE FUNCIÓN RENAL
        renal_score = 0
        if features['tfg'] < 30:
            renal_score = 25
            risk_factors.append(f"Insuficiencia renal severa (TFG: {features['tfg']})")
        elif features['tfg'] < 60:
            renal_score = 15
            risk_factors.append(f"Insuficiencia renal moderada (TFG: {features['tfg']})")
        
        if features['microalbuminuria_encoded']:
            renal_score += 10
            risk_factors.append("Microalbuminuria presente")
        
        detailed_scores['funcion_renal'] = renal_score
        risk_score += renal_score
        
        # 6. EVALUACIÓN DE MARCADORES INFLAMATORIOS
        inflamacion_score = 0
        if features['proteina_c_reactiva'] >= 3.0:
            inflamacion_score += 10
            risk_factors.append(f"PCR elevada ({features['proteina_c_reactiva']} mg/L)")
        
        if features['homocisteina'] >= 15:
            inflamacion_score += 10
            risk_factors.append(f"Homocisteína elevada ({features['homocisteina']} µmol/L)")
        
        detailed_scores['inflamacion'] = inflamacion_score
        risk_score += inflamacion_score
        
        # 7. EVALUACIÓN DE ESTILO DE VIDA
        estilo_vida_score = 0
        
        # Actividad física
        if features['actividad_fisica_score'] == 0:
            estilo_vida_score += 10
            risk_factors.append("Estilo de vida sedentario")
        
        # Dieta
        if features['dieta_score'] == 0:
            estilo_vida_score += 10
            risk_factors.append("Dieta poco saludable")
        
        # Alcohol
        if features['unidades_alcohol_semana'] > 14:
            estilo_vida_score += 10
            risk_factors.append(f"Consumo excesivo de alcohol ({features['unidades_alcohol_semana']} unidades/semana)")
        
        detailed_scores['estilo_vida'] = estilo_vida_score
        risk_score += estilo_vida_score
        
        # 8. EVALUACIÓN DE FACTORES PSICOSOCIALES
        psicosocial_score = 0
        if features['estres_encoded']:
            psicosocial_score += features['nivel_estres'] * 5
            risk_factors.append(f"Estrés psicológico nivel {features['nivel_estres']}")
        
        detailed_scores['psicosocial'] = psicosocial_score
        risk_score += psicosocial_score
        
        # 9. EVALUACIÓN DE CONDICIONES MÉDICAS
        condiciones_score = 0
        if features['apnea_sueno_encoded']:
            condiciones_score += 10
            risk_factors.append("Apnea del sueño")
        
        if features['antecedentes_familiares_encoded']:
            condiciones_score += 15
            risk_factors.append("Antecedentes familiares de ECV")
        
        detailed_scores['condiciones_medicas'] = condiciones_score
        risk_score += condiciones_score
        
        # Calcular nivel de riesgo final
        risk_level = self._calculate_risk_level(risk_score)
        
        # Generar recomendaciones
        recommendations = self._generate_recommendations(risk_factors, risk_level, features)
        
        return {
            'riesgo_nivel': risk_level,
            'probabilidad': risk_score,
            'factores_riesgo': risk_factors,
            'recomendaciones': recommendations,
            'scores_detallados': detailed_scores,
            'confidence_score': 0.8  # Score de confianza para predicción basada en reglas
        }

    def _calculate_risk_level(self, risk_score: float) -> str:
        """Calcular nivel de riesgo basado en score total"""
        if risk_score >= 70:
            return "Alto"
        elif risk_score >= 40:
            return "Medio"
        else:
            return "Bajo"

    def _generate_recommendations(self, risk_factors: List[str], risk_level: str, features: Dict[str, float]) -> List[str]:
        """Generar recomendaciones personalizadas basadas en los factores de riesgo"""
        recommendations = []
        
        # Recomendaciones generales según nivel de riesgo
        if risk_level == 'alto':
            recommendations.extend([
                "Consulta inmediata con cardiólogo",
                "Realizar pruebas de esfuerzo",
                "Considerar estudios de imagen cardíaca"
            ])
        elif risk_level == 'moderado':
            recommendations.extend([
                "Seguimiento médico cada 3-6 meses",
                "Realizar pruebas de laboratorio completas"
            ])
        
        # Recomendaciones específicas por factor de riesgo
        for factor in risk_factors:
            if "Hipertensión" in factor:
                recommendations.extend([
                    "Control estricto de presión arterial",
                    "Reducir consumo de sal",
                    "Considerar medicación antihipertensiva si no está en tratamiento"
                ])
            
            if "Colesterol" in factor:
                recommendations.extend([
                    "Dieta baja en grasas saturadas",
                    "Aumentar consumo de fibra",
                    "Considerar estatinas si no está en tratamiento"
                ])
            
            if "Diabetes" in factor:
                recommendations.extend([
                    "Control estricto de glucemia",
                    "Dieta controlada en carbohidratos",
                    "Ejercicio regular"
                ])
            
            if "Insuficiencia renal" in factor:
                recommendations.extend([
                    "Control de función renal",
                    "Dieta baja en proteínas",
                    "Control estricto de presión arterial"
                ])
            
            if "PCR elevada" in factor or "Homocisteína elevada" in factor:
                recommendations.extend([
                    "Evaluar causas de inflamación",
                    "Considerar suplementación con ácido fólico si hay homocisteína elevada",
                    "Control de otros factores inflamatorios"
                ])
            
            if "Estilo de vida sedentario" in factor:
                recommendations.extend([
                    "Iniciar programa de ejercicio gradual",
                    "Objetivo: 150 minutos de actividad moderada por semana",
                    "Considerar asesoría con fisioterapeuta"
                ])
            
            if "Dieta poco saludable" in factor:
                recommendations.extend([
                    "Consultar con nutricionista",
                    "Implementar dieta mediterránea",
                    "Aumentar consumo de frutas y verduras"
                ])
            
            if "Consumo excesivo de alcohol" in factor:
                recommendations.extend([
                    "Reducir consumo de alcohol",
                    "Considerar programa de apoyo si hay dependencia",
                    "Máximo 1-2 unidades por día"
                ])
            
            if "Estrés psicológico" in factor:
                recommendations.extend([
                    "Considerar técnicas de manejo de estrés",
                    "Evaluar necesidad de apoyo psicológico",
                    "Implementar rutinas de relajación"
                ])
            
            if "Apnea del sueño" in factor:
                recommendations.extend([
                    "Evaluación por especialista en sueño",
                    "Considerar estudio de polisomnografía",
                    "Implementar medidas de higiene del sueño"
                ])
        
        # Recomendaciones específicas según valores
        if features['circunferencia_cintura'] > 102 if features['sexo_encoded'] == 1 else 88:
            recommendations.append("Reducir circunferencia de cintura mediante dieta y ejercicio")
        
        if features['indice_cintura_cadera'] > 0.9 if features['sexo_encoded'] == 1 else 0.85:
            recommendations.append("Implementar programa de reducción de grasa abdominal")
        
        if features['acido_urico'] > 7.0:
            recommendations.append("Dieta baja en purinas y control de ácido úrico")
        
        if features['fibrinogeno'] > 400:
            recommendations.append("Evaluar riesgo trombótico y considerar medidas preventivas")
        
        # Recomendaciones de seguimiento
        recommendations.extend([
            "Realizar controles periódicos según nivel de riesgo",
            "Mantener registro de mediciones y síntomas",
            "Seguir plan de tratamiento prescrito"
        ])
        
        return list(set(recommendations))  # Eliminar duplicados

    def _calculate_detailed_scores(self, features: Dict[str, float], medical_record) -> Dict[str, Any]:
        """Calcular scores detallados por categoría"""
        return {
            'framingham_score': self._calculate_framingham_score(features),
            'reynolds_score': self._calculate_reynolds_score(features),
            'acc_aha_score': self._calculate_acc_aha_score(features),
            'metabolic_syndrome': self._evaluate_metabolic_syndrome(features),
        }

    def _calculate_framingham_score(self, features: Dict[str, float]) -> float:
        """Calcular Framingham Risk Score simplificado"""
        score = 0
        
        # Edad
        edad = features['edad']
        if features['sexo_encoded'] == 1:  # Hombre
            if edad >= 70: score += 11
            elif edad >= 60: score += 8
            elif edad >= 50: score += 5
            elif edad >= 40: score += 2
        else:  # Mujer
            if edad >= 70: score += 12
            elif edad >= 60: score += 9
            elif edad >= 50: score += 6
            elif edad >= 40: score += 3
        
        # Colesterol total
        if features['colesterol_total'] >= 280: score += 3
        elif features['colesterol_total'] >= 240: score += 2
        elif features['colesterol_total'] >= 200: score += 1
        
        # HDL
        if features['colesterol_hdl'] < 35: score += 2
        elif features['colesterol_hdl'] < 45: score += 1
        
        # Presión arterial
        if features['presion_sistolica'] >= 160: score += 3
        elif features['presion_sistolica'] >= 140: score += 2
        elif features['presion_sistolica'] >= 130: score += 1
        
        # Diabetes
        if features['diabetes_encoded']: score += 2
        
        # Tabaquismo
        if features['indice_paquetes'] > 0: score += 2
        
        return min(score * 2, 30)  # Convertir a porcentaje

    def _calculate_reynolds_score(self, features: Dict[str, float]) -> float:
        """Calcular Reynolds Risk Score simplificado"""
        # Implementación simplificada del Reynolds Score
        base_score = self._calculate_framingham_score(features)
        
        # Ajustes por factores adicionales
        if features['antecedentes_encoded'] == 1:
            base_score *= 1.2
        
        if features['imc'] >= 30:
            base_score *= 1.1
        
        return min(base_score, 30)

    def _calculate_acc_aha_score(self, features: Dict[str, float]) -> float:
        """Calcular ACC/AHA Risk Score simplificado"""
        # Implementación simplificada basada en las guías ACC/AHA
        score = 0
        
        # Factores principales
        if features['edad'] >= 65: score += 15
        elif features['edad'] >= 55: score += 10
        elif features['edad'] >= 45: score += 5
        
        if features['presion_sistolica'] >= 140: score += 10
        if features['colesterol_total'] >= 240: score += 8
        if features['diabetes_encoded']: score += 12
        if features['indice_paquetes'] > 10: score += 8
        
        return min(score, 30)

    def _evaluate_metabolic_syndrome(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Evaluar síndrome metabólico"""
        criteria_met = 0
        criteria = []
        
        # Criterios del síndrome metabólico
        if features['imc'] >= 30:  # Aproximación con IMC
            criteria_met += 1
            criteria.append("Obesidad abdominal")
        
        if features['trigliceridos'] >= 150:
            criteria_met += 1
            criteria.append("Triglicéridos elevados")
        
        if features['colesterol_hdl'] < 40 if features['sexo_encoded'] else features['colesterol_hdl'] < 50:
            criteria_met += 1
            criteria.append("HDL bajo")
        
        if features['presion_sistolica'] >= 130 or features['presion_diastolica'] >= 85:
            criteria_met += 1
            criteria.append("Hipertensión arterial")
        
        if features['glucosa'] >= 100:
            criteria_met += 1
            criteria.append("Glucosa alterada")
        
        has_syndrome = criteria_met >= 3
        
        return {
            'tiene_sindrome': has_syndrome,
            'criterios_cumplidos': criteria_met,
            'criterios': criteria,
            'riesgo': "Alto" if has_syndrome else "Moderado" if criteria_met >= 2 else "Bajo"
        }

    def _ml_prediction(self, features: Dict[str, float], medical_record) -> Dict[str, Any]:
        """Predicción usando modelo ML entrenado"""
        try:
            # Convertir features a array
            feature_array = np.array([list(features.values())])
            
            # Normalizar si hay scaler
            if self.scaler:
                feature_array = self.scaler.transform(feature_array)
            
            # Predicción
            probability = self.model.predict_proba(feature_array)[0][1]
            confidence = np.max(self.model.predict_proba(feature_array)[0])
            
            # Determinar nivel de riesgo
            risk_level = self._calculate_risk_level(probability * 100)
            
            # Análisis de factores (usando importancia del modelo si está disponible)
            risk_factors = self._analyze_ml_risk_factors(features, self.model)
            recommendations = self._generate_recommendations(risk_factors, risk_level, features)
            
            return {
                'riesgo_nivel': risk_level,
                'probabilidad': float(probability * 100),
                'factores_riesgo': risk_factors,
                'recomendaciones': recommendations,
                'model_version': 'ml_v1.2.0',
                'confidence_score': float(confidence),
                'features_used': features
            }
            
        except Exception as e:
            logger.error(f"Error en predicción ML: {e}")
            return self._rule_based_prediction(features, medical_record)

    def _analyze_ml_risk_factors(self, features: Dict[str, float], model) -> List[str]:
        """Analizar factores de riesgo basado en importancia del modelo ML"""
        risk_factors = []
        
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_importance = dict(zip(self.feature_names, importances))
                
                # Ordenar por importancia
                sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
                
                # Analizar top features
                for feature_name, importance in sorted_features[:8]:
                    if importance > 0.05:  # Solo features importantes
                        factor_description = self._describe_risk_factor(feature_name, features[feature_name])
                        if factor_description:
                            risk_factors.append(factor_description)
            
        except Exception as e:
            logger.error(f"Error analizando factores ML: {e}")
            # Fallback a análisis básico
            risk_factors = self._basic_risk_factor_analysis(features)
        
        return risk_factors

    def _describe_risk_factor(self, feature_name: str, value: float) -> str:
        """Describir factor de riesgo basado en el nombre y valor"""
        descriptions = {
            'edad': f"Edad: {value:.0f} años" if value > 45 else None,
            'imc': f"IMC elevado: {value:.1f}" if value > 25 else None,
            'presion_sistolica': f"Presión sistólica: {value:.0f} mmHg" if value > 130 else None,
            'presion_diastolica': f"Presión diastólica: {value:.0f} mmHg" if value > 80 else None,
            'colesterol_total': f"Colesterol total: {value:.0f} mg/dL" if value > 200 else None,
            'glucosa': f"Glucosa: {value:.0f} mg/dL" if value > 100 else None,
            'indice_paquetes': f"Tabaquismo: {value:.1f} paquetes/año" if value > 0 else None,
        }
        
        return descriptions.get(feature_name)

    def _basic_risk_factor_analysis(self, features: Dict[str, float]) -> List[str]:
        """Análisis básico de factores de riesgo"""
        risk_factors = []
        
        if features['edad'] > 65:
            risk_factors.append(f"Edad avanzada ({features['edad']:.0f} años)")
        if features['imc'] > 30:
            risk_factors.append(f"Obesidad (IMC: {features['imc']:.1f})")
        if features['presion_sistolica'] > 140:
            risk_factors.append(f"Hipertensión ({features['presion_sistolica']:.0f} mmHg)")
        if features['colesterol_total'] > 240:
            risk_factors.append(f"Colesterol elevado ({features['colesterol_total']:.0f} mg/dL)")
        if features['indice_paquetes'] > 10:
            risk_factors.append(f"Tabaquismo ({features['indice_paquetes']:.1f} paquetes/año)")
        
        return risk_factors

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
