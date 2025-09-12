"""
Validadores personalizados para datos médicos
"""
from django.core.exceptions import ValidationError
from django.core.validators import BaseValidator
from decimal import Decimal
import datetime


class MedicalRangeValidator(BaseValidator):
    """Validador para rangos médicos específicos"""
    
    message = "El valor %(show_value)s está fuera del rango médico válido (%(limit_min)s - %(limit_max)s)"
    code = "medical_range_invalid"
    
    def __init__(self, limit_min, limit_max, message=None):
        self.limit_min = limit_min
        self.limit_max = limit_max
        if message:
            self.message = message
    
    def __call__(self, value):
        if value is None:
            return
        
        if not (self.limit_min <= value <= self.limit_max):
            raise ValidationError(
                self.message % {
                    'show_value': value,
                    'limit_min': self.limit_min,
                    'limit_max': self.limit_max
                },
                code=self.code,
                params={'value': value}
            )


class AgeValidator:
    """Validador de edad basado en fecha de nacimiento"""
    
    def __init__(self, min_age=0, max_age=120):
        self.min_age = min_age
        self.max_age = max_age
    
    def __call__(self, birth_date):
        if birth_date is None:
            raise ValidationError("La fecha de nacimiento es obligatoria")
        
        if birth_date > datetime.date.today():
            raise ValidationError("La fecha de nacimiento no puede ser futura")
        
        today = datetime.date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        if age < self.min_age or age > self.max_age:
            raise ValidationError(f"La edad debe estar entre {self.min_age} y {self.max_age} años")


class BloodPressureValidator:
    """Validador para presión arterial"""
    
    def __call__(self, systolic, diastolic):
        if systolic is None or diastolic is None:
            raise ValidationError("La presión arterial sistólica y diastólica son obligatorias")
        
        if not (50 <= systolic <= 300):
            raise ValidationError("La presión sistólica debe estar entre 50 y 300 mmHg")
        
        if not (30 <= diastolic <= 200):
            raise ValidationError("La presión diastólica debe estar entre 30 y 200 mmHg")
        
        if diastolic >= systolic:
            raise ValidationError("La presión sistólica debe ser mayor que la diastólica")
        
        # Validaciones médicas adicionales
        if systolic >= 180 or diastolic >= 110:
            # Crisis hipertensiva - logging especial
            import logging
            logger = logging.getLogger('cardiovascular.medical_alerts')
            logger.warning(f"ALERTA: Crisis hipertensiva detectada - Sistólica: {systolic}, Diastólica: {diastolic}")


def validate_cholesterol_levels(cholesterol_total, hdl=None, ldl=None):
    """Validador para niveles de colesterol"""
    if cholesterol_total is None:
        raise ValidationError("El colesterol total es obligatorio para predicciones cardiovasculares")
    
    if not (100 <= cholesterol_total <= 500):
        raise ValidationError("El colesterol total debe estar entre 100 y 500 mg/dL")
    
    if hdl is not None and not (20 <= hdl <= 150):
        raise ValidationError("El colesterol HDL debe estar entre 20 y 150 mg/dL")
    
    if ldl is not None and not (50 <= ldl <= 400):
        raise ValidationError("El colesterol LDL debe estar entre 50 y 400 mg/dL")
    
    # Alertas médicas
    if cholesterol_total >= 240:
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        logger.warning(f"ALERTA: Colesterol alto detectado - Total: {cholesterol_total} mg/dL")


def validate_glucose_level(glucose):
    """Validador para niveles de glucosa"""
    if glucose is None:
        raise ValidationError("El nivel de glucosa es obligatorio para predicciones cardiovasculares")
    
    if not (50 <= glucose <= 600):
        raise ValidationError("La glucosa debe estar entre 50 y 600 mg/dL")
    
    # Alertas médicas
    if glucose >= 200:
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        logger.warning(f"ALERTA: Glucosa elevada detectada - {glucose} mg/dL")
    
    if glucose <= 70:
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        logger.warning(f"ALERTA: Hipoglucemia detectada - {glucose} mg/dL")


def validate_heart_rate(heart_rate):
    """Validador para frecuencia cardíaca"""
    if heart_rate is None:
        raise ValidationError("La frecuencia cardíaca es obligatoria para predicciones cardiovasculares")
    
    if not (40 <= heart_rate <= 200):
        raise ValidationError("La frecuencia cardíaca debe estar entre 40 y 200 latidos por minuto")
    
    # Alertas médicas
    if heart_rate < 60:
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        logger.warning(f"ALERTA: Bradicardia detectada - {heart_rate} lpm")
    
    if heart_rate > 100:
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        logger.warning(f"ALERTA: Taquicardia detectada - {heart_rate} lpm")


class ComprehensiveMedicalValidator:
    """Validador comprensivo para datos médicos críticos"""
    
    def __init__(self, patient_data, medical_record_data):
        self.patient_data = patient_data
        self.medical_record_data = medical_record_data
        self.errors = []
    
    def validate_all(self):
        """Ejecuta todas las validaciones médicas"""
        try:
            self._validate_patient_basic_info()
            self._validate_vital_signs()
            self._validate_laboratory_values()
            self._validate_medical_consistency()
            
            if self.errors:
                raise ValidationError(self.errors)
            
            return True
            
        except Exception as e:
            import logging
            logger = logging.getLogger('cardiovascular.validation')
            logger.error(f"Error en validación médica comprensiva: {str(e)}")
            raise
    
    def _validate_patient_basic_info(self):
        """Valida información básica del paciente"""
        # Validar fecha de nacimiento
        birth_date = self.patient_data.get('fecha_nacimiento')
        if birth_date:
            try:
                age_validator = AgeValidator(18, 120)  # Predicciones solo para adultos
                age_validator(birth_date)
            except ValidationError as e:
                self.errors.append(f"Fecha de nacimiento: {e.message}")
        else:
            self.errors.append("La fecha de nacimiento es obligatoria")
        
        # Validar sexo
        if not self.patient_data.get('sexo'):
            self.errors.append("El sexo es obligatorio para predicciones cardiovasculares")
    
    def _validate_vital_signs(self):
        """Valida signos vitales críticos"""
        systolic = self.medical_record_data.get('presion_sistolica')
        diastolic = self.medical_record_data.get('presion_diastolica')
        heart_rate = self.medical_record_data.get('frecuencia_cardiaca')
        
        try:
            bp_validator = BloodPressureValidator()
            bp_validator(systolic, diastolic)
        except ValidationError as e:
            self.errors.append(f"Presión arterial: {e.message}")
        
        try:
            validate_heart_rate(heart_rate)
        except ValidationError as e:
            self.errors.append(f"Frecuencia cardíaca: {e.message}")
    
    def _validate_laboratory_values(self):
        """Valida valores de laboratorio críticos"""
        cholesterol = self.medical_record_data.get('colesterol')
        glucose = self.medical_record_data.get('glucosa')
        
        try:
            validate_cholesterol_levels(cholesterol)
        except ValidationError as e:
            self.errors.append(f"Colesterol: {e.message}")
        
        try:
            validate_glucose_level(glucose)
        except ValidationError as e:
            self.errors.append(f"Glucosa: {e.message}")
    
    def _validate_medical_consistency(self):
        """Valida consistencia entre datos médicos"""
        # Verificar que la edad calculada coincida con la registrada
        birth_date = self.patient_data.get('fecha_nacimiento')
        recorded_age = self.medical_record_data.get('edad')
        
        if birth_date and recorded_age:
            today = datetime.date.today()
            calculated_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            if abs(calculated_age - recorded_age) > 1:  # Tolerancia de 1 año
                self.errors.append(f"Inconsistencia en edad: calculada {calculated_age}, registrada {recorded_age}")


# Validadores específicos para diferentes rangos médicos
validate_weight = MedicalRangeValidator(20, 300, "El peso debe estar entre 20 y 300 kg")
validate_height = MedicalRangeValidator(100, 250, "La altura debe estar entre 100 y 250 cm")
validate_bmi = MedicalRangeValidator(10, 60, "El IMC debe estar entre 10 y 60")
validate_hba1c = MedicalRangeValidator(4.0, 18.0, "La HbA1c debe estar entre 4.0 y 18.0%")
