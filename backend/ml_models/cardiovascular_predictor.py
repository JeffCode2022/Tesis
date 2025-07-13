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
        self.model_path = os.path.join(settings.ML_MODELS_PATH, 'cardiovascular_model.pkl')
        self.scaler_path = os.path.join(settings.ML_MODELS_PATH, 'scaler.pkl')
        
        self.feature_names = [
            'edad', 'imc', 'presion_sistolica', 'presion_diastolica',
            'colesterol_total', 'colesterol_hdl', 'colesterol_ldl',
            'trigliceridos', 'glucosa', 'hba1c', 'frecuencia_cardiaca',
            'indice_paquetes', 'actividad_fisica_score', 'sexo_encoded',
            'antecedentes_encoded', 'diabetes_encoded', 'hipertension_encoded'
        ]
        
        self.model = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        """Cargar modelos entrenados si existen"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Modelo cardiovascular cargado exitosamente")
            else:
                logger.info("Modelo no encontrado, usando sistema de reglas médicas")
                
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
            
            # Realizar predicción
            if self.model and self.scaler:
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
        """Extraer y preparar features del registro médico"""
        patient = medical_record.patient
        
        # Calcular IMC
        imc = patient.imc or 25.0  # Valor por defecto
        
        # Calcular índice de paquetes/año
        indice_paquetes = medical_record.indice_paquetes_ano
        
        # Mapear actividad física a score numérico
        actividad_mapping = {
            'sedentario': 0, 'ligero': 1, 'moderado': 2, 'intenso': 3
        }
        actividad_score = actividad_mapping.get(medical_record.actividad_fisica, 0)
        
        # Mapear calidad de dieta
        dieta_mapping = {
            'poco_saludable': 0, 'moderada': 1, 'saludable': 2, 'muy_saludable': 3
        }
        dieta_score = dieta_mapping.get(medical_record.calidad_dieta, 1)
        
        # Codificar variables categóricas
        sexo_encoded = 1 if patient.sexo == 'M' else 0
        
        antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0.5}
        antecedentes_encoded = antecedentes_mapping.get(medical_record.antecedentes_cardiacos, 0)
        
        # Calcular edad desde fecha de nacimiento
        from datetime import date
        if patient.fecha_nacimiento:
            today = date.today()
            age = today.year - patient.fecha_nacimiento.year - ((today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day))
        else:
            age = 0
        
        features = {
            # Variables demográficas
            'edad': age,
            'sexo_encoded': sexo_encoded,
            
            # Antropometría
            'imc': imc,
            'circunferencia_cintura': medical_record.circunferencia_cintura,
            'indice_cintura_cadera': medical_record.indice_cintura_cadera,
            
            # Presión arterial
            'presion_sistolica': medical_record.presion_sistolica,
            'presion_diastolica': medical_record.presion_diastolica,
            
            # Perfil lipídico
            'colesterol_total': medical_record.colesterol_total or 200,
            'colesterol_hdl': medical_record.colesterol_hdl or 50,
            'colesterol_ldl': medical_record.colesterol_ldl or 130,
            'trigliceridos': medical_record.trigliceridos or 150,
            
            # Glucosa y diabetes
            'glucosa': medical_record.glucosa or 100,
            'hba1c': medical_record.hemoglobina_glicosilada or 5.5,
            'diabetes_encoded': 1 if medical_record.diabetes else 0,
            
            # Función renal
            'creatinina': medical_record.creatinina or 1.0,
            'tfg': medical_record.tfg or 90,
            'microalbuminuria_encoded': 1 if medical_record.microalbuminuria else 0,
            
            # Marcadores inflamatorios
            'proteina_c_reactiva': medical_record.proteina_c_reactiva or 1.0,
            'homocisteina': medical_record.homocisteina or 10.0,
            
            # Otros biomarcadores
            'acido_urico': medical_record.acido_urico or 5.0,
            'fibrinogeno': medical_record.fibrinogeno or 300,
            
            # Factores de riesgo
            'hipertension_encoded': 1 if medical_record.hipertension else 0,
            'tabaquismo_encoded': 1 if medical_record.tabaquismo else 0,
            'indice_paquetes': indice_paquetes,
            'antecedentes_encoded': antecedentes_encoded,
            
            # Estilo de vida
            'actividad_fisica_score': actividad_score,
            'dieta_score': dieta_score,
            'alcohol_encoded': 1 if medical_record.consumo_alcohol else 0,
            'unidades_alcohol_semana': medical_record.unidades_alcohol_semana,
            
            # Factores psicosociales
            'estres_encoded': 1 if medical_record.estres_psicologico else 0,
            'nivel_estres': medical_record.nivel_estres,
            
            # Condiciones médicas
            'apnea_sueno_encoded': 1 if medical_record.apnea_sueno else 0,
            'antecedentes_familiares_encoded': 1 if medical_record.antecedentes_familiares else 0,
            
            # Medicamentos
            'toma_estatinas_encoded': 1 if medical_record.toma_estatinas else 0,
            'toma_antihipertensivos_encoded': 1 if medical_record.toma_antihipertensivos else 0,
            'toma_antidiabeticos_encoded': 1 if medical_record.toma_antidiabeticos else 0,
        }
        
        return features

    def _rule_based_prediction(self, features: Dict[str, float], medical_record) -> Dict[str, Any]:
        """Sistema de predicción basado en guías clínicas"""
        
        risk_score = 0
        risk_factors = []
        detailed_scores = {}
        
        # 1. EVALUACIÓN POR EDAD Y SEXO
        age_sex_score = 0
        if features['sexo_encoded'] == 1:  # Hombre
            if features['edad'] >= 45:
                age_sex_score += 20
                risk_factors.append(f"Hombre ≥45 años (edad: {features['edad']})")
        else:  # Mujer
            if features['edad'] >= 55:
                age_sex_score += 20
                risk_factors.append(f"Mujer ≥55 años (edad: {features['edad']})")
        
        detailed_scores['edad_sexo'] = age_sex_score
        risk_score += age_sex_score
        
        # 2. EVALUACIÓN DE PRESIÓN ARTERIAL
        bp_score = 0
        sistolica = features['presion_sistolica']
        diastolica = features['presion_diastolica']
        
        if sistolica >= 180 or diastolica >= 110:
            bp_score = 30
            risk_factors.append(f"Hipertensión severa ({sistolica}/{diastolica} mmHg)")
        elif sistolica >= 160 or diastolica >= 100:
            bp_score = 25
            risk_factors.append(f"Hipertensión moderada ({sistolica}/{diastolica} mmHg)")
        elif sistolica >= 140 or diastolica >= 90:
            bp_score = 20
            risk_factors.append(f"Hipertensión leve ({sistolica}/{diastolica} mmHg)")
        elif sistolica >= 130 or diastolica >= 80:
            bp_score = 10
            risk_factors.append(f"Presión arterial elevada ({sistolica}/{diastolica} mmHg)")
        
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
