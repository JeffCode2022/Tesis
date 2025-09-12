"""
Validadores para datos médicos críticos en predicciones cardiovasculares
"""
import logging
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Resultado de validación con detalles"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    corrected_values: Dict[str, Any]


class MedicalDataValidator:
    """
    Validador robusto para datos médicos críticos
    Valida rangos fisiológicos y detecta valores anómalos
    """
    
    # Rangos fisiológicos normales y límites extremos
    VALIDATION_RANGES = {
        'edad': {'min': 0, 'max': 120, 'normal_min': 18, 'normal_max': 90},
        'peso': {'min': 1, 'max': 300, 'normal_min': 30, 'normal_max': 150},
        'altura': {'min': 50, 'max': 250, 'normal_min': 140, 'normal_max': 210},
        'imc': {'min': 10, 'max': 60, 'normal_min': 18.5, 'normal_max': 30},
        'presion_sistolica': {'min': 70, 'max': 250, 'normal_min': 90, 'normal_max': 140},
        'presion_diastolica': {'min': 40, 'max': 150, 'normal_min': 60, 'normal_max': 90},
        'frecuencia_cardiaca': {'min': 30, 'max': 200, 'normal_min': 60, 'normal_max': 100},
        'colesterol': {'min': 100, 'max': 500, 'normal_min': 150, 'normal_max': 200},
        'colesterol_hdl': {'min': 20, 'max': 100, 'normal_min': 40, 'normal_max': 60},
        'colesterol_ldl': {'min': 50, 'max': 300, 'normal_min': 70, 'normal_max': 130},
        'trigliceridos': {'min': 30, 'max': 1000, 'normal_min': 50, 'normal_max': 150},
        'glucosa': {'min': 50, 'max': 600, 'normal_min': 70, 'normal_max': 140},
        'hemoglobina_glicosilada': {'min': 3, 'max': 20, 'normal_min': 4, 'normal_max': 7},
        'cigarrillos_dia': {'min': 0, 'max': 100, 'normal_min': 0, 'normal_max': 20},
        'anos_tabaquismo': {'min': 0, 'max': 80, 'normal_min': 0, 'normal_max': 40},
    }
    
    CATEGORICAL_VALUES = {
        'sexo': ['M', 'F'],
        'actividad_fisica': ['sedentario', 'ligero', 'moderado', 'intenso'],
        'antecedentes_cardiacos': ['si', 'no', 'desconoce'],
        'calidad_dieta': ['poco_saludable', 'moderada', 'saludable', 'muy_saludable'],
    }
    
    def __init__(self):
        self.reset_validation()
    
    def reset_validation(self):
        """Reinicia el estado de validación"""
        self.errors = []
        self.warnings = []
        self.corrected_values = {}
    
    def validate_patient_data(self, patient, medical_record) -> ValidationResult:
        """
        Valida datos completos de paciente y registro médico
        
        Args:
            patient: Instancia del modelo Patient
            medical_record: Instancia del modelo MedicalRecord
            
        Returns:
            ValidationResult con resultado de validación
        """
        self.reset_validation()
        
        # Validaciones críticas (errores)
        self._validate_patient_basic_data(patient)
        self._validate_medical_record_data(medical_record)
        self._validate_physiological_consistency(patient, medical_record)
        
        # Validaciones de advertencia (warnings)
        self._validate_normal_ranges(patient, medical_record)
        
        result = ValidationResult(
            is_valid=len(self.errors) == 0,
            errors=self.errors.copy(),
            warnings=self.warnings.copy(),
            corrected_values=self.corrected_values.copy()
        )
        
        logger.info(f"Validación completada: {'VÁLIDO' if result.is_valid else 'INVÁLIDO'}")
        if self.errors:
            logger.error(f"Errores encontrados: {self.errors}")
        if self.warnings:
            logger.warning(f"Advertencias: {self.warnings}")
            
        return result
    
    def _validate_patient_basic_data(self, patient):
        """Valida datos básicos del paciente"""
        # Validar edad
        if hasattr(patient, 'fecha_nacimiento') and patient.fecha_nacimiento:
            from datetime import date
            today = date.today()
            age = today.year - patient.fecha_nacimiento.year - (
                (today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day)
            )
            if not self._is_in_range(age, 'edad'):
                self.errors.append(f"Edad inválida: {age} años (rango válido: 0-120)")
        else:
            self.errors.append("Fecha de nacimiento es requerida para calcular la edad")
        
        # Validar peso y altura
        if not patient.peso or not self._is_in_range(patient.peso, 'peso'):
            self.errors.append(f"Peso inválido: {patient.peso} kg (rango válido: 1-300)")
        
        if not patient.altura or not self._is_in_range(patient.altura, 'altura'):
            self.errors.append(f"Altura inválida: {patient.altura} cm (rango válido: 50-250)")
        
        # Validar IMC si peso y altura están disponibles
        if patient.peso and patient.altura:
            imc = patient.peso / ((patient.altura / 100) ** 2)
            if not self._is_in_range(imc, 'imc'):
                self.errors.append(f"IMC calculado inválido: {imc:.1f} (rango válido: 10-60)")
        
        # Validar sexo
        if not patient.sexo or patient.sexo not in self.CATEGORICAL_VALUES['sexo']:
            self.errors.append(f"Sexo inválido: {patient.sexo} (valores válidos: M, F)")
    
    def _validate_medical_record_data(self, medical_record):
        """Valida datos del registro médico"""
        # Validar presión arterial
        if not medical_record.presion_sistolica or not self._is_in_range(medical_record.presion_sistolica, 'presion_sistolica'):
            self.errors.append(f"Presión sistólica inválida: {medical_record.presion_sistolica} mmHg")
        
        if not medical_record.presion_diastolica or not self._is_in_range(medical_record.presion_diastolica, 'presion_diastolica'):
            self.errors.append(f"Presión diastólica inválida: {medical_record.presion_diastolica} mmHg")
        
        # Validar que sistólica > diastólica
        if (medical_record.presion_sistolica and medical_record.presion_diastolica and 
            medical_record.presion_sistolica <= medical_record.presion_diastolica):
            self.errors.append("Presión sistólica debe ser mayor que diastólica")
        
        # Validar frecuencia cardíaca si está presente
        if medical_record.frecuencia_cardiaca and not self._is_in_range(medical_record.frecuencia_cardiaca, 'frecuencia_cardiaca'):
            self.errors.append(f"Frecuencia cardíaca inválida: {medical_record.frecuencia_cardiaca} lpm")
        
        # Validar laboratorios si están presentes
        if medical_record.colesterol and not self._is_in_range(medical_record.colesterol, 'colesterol'):
            self.errors.append(f"Colesterol total inválido: {medical_record.colesterol} mg/dL")
        
        if medical_record.glucosa and not self._is_in_range(medical_record.glucosa, 'glucosa'):
            self.errors.append(f"Glucosa inválida: {medical_record.glucosa} mg/dL")
        
        # Validar hábitos de tabaquismo
        if medical_record.cigarrillos_dia < 0 or medical_record.cigarrillos_dia > 100:
            self.errors.append(f"Cigarrillos por día inválido: {medical_record.cigarrillos_dia}")
        
        if medical_record.anos_tabaquismo < 0 or medical_record.anos_tabaquismo > 80:
            self.errors.append(f"Años de tabaquismo inválido: {medical_record.anos_tabaquismo}")
        
        # Validar valores categóricos
        if (hasattr(medical_record, 'actividad_fisica') and medical_record.actividad_fisica and 
            medical_record.actividad_fisica not in self.CATEGORICAL_VALUES['actividad_fisica']):
            self.errors.append(f"Actividad física inválida: {medical_record.actividad_fisica}")
        
        if (hasattr(medical_record, 'antecedentes_cardiacos') and medical_record.antecedentes_cardiacos and 
            medical_record.antecedentes_cardiacos not in self.CATEGORICAL_VALUES['antecedentes_cardiacos']):
            self.errors.append(f"Antecedentes cardíacos inválidos: {medical_record.antecedentes_cardiacos}")
    
    def _validate_physiological_consistency(self, patient, medical_record):
        """Valida consistencia fisiológica entre datos"""
        # Si fuma pero tiene 0 años de tabaquismo
        if medical_record.cigarrillos_dia > 0 and medical_record.anos_tabaquismo == 0:
            self.warnings.append("Paciente fuma pero tiene 0 años de tabaquismo")
        
        # Si no fuma pero tiene años de tabaquismo
        if medical_record.cigarrillos_dia == 0 and medical_record.anos_tabaquismo > 0:
            self.warnings.append("Paciente no fuma actualmente pero tiene historial de tabaquismo")
        
        # Colesterol HDL muy bajo con colesterol total normal
        if (medical_record.colesterol_hdl and medical_record.colesterol and 
            medical_record.colesterol_hdl < 30 and medical_record.colesterol < 200):
            self.warnings.append("HDL muy bajo con colesterol total normal - revisar valores")
    
    def _validate_normal_ranges(self, patient, medical_record):
        """Valida si los valores están en rangos normales (warnings)"""
        # Advertencias para valores fuera de rangos normales pero no críticos
        if patient.peso and patient.altura:
            imc = patient.peso / ((patient.altura / 100) ** 2)
            normal_range = self.VALIDATION_RANGES['imc']
            if imc < normal_range['normal_min']:
                self.warnings.append(f"IMC bajo: {imc:.1f} (normal: 18.5-30)")
            elif imc > normal_range['normal_max']:
                self.warnings.append(f"IMC elevado: {imc:.1f} (normal: 18.5-30)")
        
        # Presión arterial fuera de rangos normales
        if medical_record.presion_sistolica:
            normal_range = self.VALIDATION_RANGES['presion_sistolica']
            if medical_record.presion_sistolica > normal_range['normal_max']:
                self.warnings.append(f"Presión sistólica elevada: {medical_record.presion_sistolica} mmHg")
        
        if medical_record.presion_diastolica:
            normal_range = self.VALIDATION_RANGES['presion_diastolica']
            if medical_record.presion_diastolica > normal_range['normal_max']:
                self.warnings.append(f"Presión diastólica elevada: {medical_record.presion_diastolica} mmHg")
    
    def _is_in_range(self, value: float, field_name: str) -> bool:
        """Verifica si un valor está en el rango válido"""
        if value is None:
            return False
        
        range_def = self.VALIDATION_RANGES.get(field_name)
        if not range_def:
            return True
        
        return range_def['min'] <= value <= range_def['max']
    
    def get_safe_defaults(self, patient, medical_record) -> Dict[str, Any]:
        """
        Obtiene valores por defecto seguros para datos faltantes
        Solo para valores no críticos
        """
        defaults = {}
        
        # Solo proporcionar defaults para valores opcionales
        if not medical_record.frecuencia_cardiaca:
            defaults['frecuencia_cardiaca'] = 75  # Valor normal promedio
        
        if not medical_record.colesterol:
            defaults['colesterol'] = 180  # Valor normal promedio
        
        if not medical_record.glucosa:
            defaults['glucosa'] = 100  # Valor normal promedio
        
        return defaults
