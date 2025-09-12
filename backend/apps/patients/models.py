from django.db import models
import uuid
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from decimal import Decimal
import datetime
import logging

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información básica
    dni = models.CharField(max_length=20, unique=True, help_text="DNI del paciente")
    nombre = models.CharField(max_length=200)
    apellidos = models.CharField(max_length=200)
    fecha_nacimiento = models.DateField(help_text="Fecha de nacimiento del paciente - OBLIGATORIO para predicciones")
    sexo = models.CharField(max_length=1, choices=GENDER_CHOICES, help_text="Sexo del paciente - OBLIGATORIO para predicciones")
    peso = models.FloatField(help_text="Peso en kilogramos")
    altura = models.FloatField(help_text="Altura en centímetros")
    
    # Información de contacto
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    
    # Información médica
    numero_historia = models.CharField(max_length=50, unique=True)
    hospital = models.CharField(max_length=200, default="Policlínico Laura Caller")
    medico_tratante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='patients_treated',
                                      help_text="Médico tratante - OBLIGATORIO para seguimiento")
    
    # Integración con sistema externo
    external_patient_id = models.CharField(max_length=100, blank=True, null=True, 
                                         help_text="ID del paciente en sistema externo")
    external_system_data = models.JSONField(default=dict, blank=True,
                                          help_text="Datos adicionales del sistema externo")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['numero_historia']),
            models.Index(fields=['external_patient_id']),
            models.Index(fields=['created_at']),
        ]
    
    def clean(self):
        """Validaciones personalizadas del modelo"""
        super().clean()
        
        # Validar fecha de nacimiento
        if self.fecha_nacimiento:
            if self.fecha_nacimiento > datetime.date.today():
                raise ValidationError({'fecha_nacimiento': 'La fecha de nacimiento no puede ser futura'})
            
            # Calcular edad
            today = datetime.date.today()
            age = today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
            
            if age < 0 or age > 120:
                raise ValidationError({'fecha_nacimiento': 'La edad debe estar entre 0 y 120 años'})
        else:
            raise ValidationError({'fecha_nacimiento': 'La fecha de nacimiento es obligatoria'})
        
        # Validar peso y altura si están presentes
        if hasattr(self, 'peso') and self.peso:
            if not (20 <= self.peso <= 300):
                raise ValidationError({'peso': 'El peso debe estar entre 20 y 300 kg'})
        
        if hasattr(self, 'altura') and self.altura:
            if not (100 <= self.altura <= 250):
                raise ValidationError({'altura': 'La altura debe estar entre 100 y 250 cm'})
    
    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def age(self):
        """Calcula la edad actual del paciente"""
        if self.fecha_nacimiento:
            today = datetime.date.today()
            return today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None

    def __str__(self):
        return f"{self.nombre} {self.apellidos} - {self.numero_historia}"

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellidos}"

    @property
    def imc(self):
        if self.peso and self.altura:
            altura_m = self.altura / 100
            return round(self.peso / (altura_m ** 2), 2)
        return None

class MedicalRecord(models.Model):
    ACTIVITY_CHOICES = [
        ('sedentario', 'Sedentario'),
        ('ligero', 'Actividad Ligera'),
        ('moderado', 'Actividad Moderada'),
        ('intenso', 'Actividad Intensa'),
    ]
    
    ANTECEDENTES_CHOICES = [
        ('si', 'Sí'),
        ('no', 'No'),
        ('desconoce', 'No sabe'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    edad = models.IntegerField(help_text="Edad del paciente en años - OBLIGATORIO para predicciones")
    
    # Signos vitales - CRÍTICOS para predicciones cardiovasculares
    presion_sistolica = models.IntegerField(help_text="mmHg - OBLIGATORIO para predicción")
    presion_diastolica = models.IntegerField(help_text="mmHg - OBLIGATORIO para predicción")
    frecuencia_cardiaca = models.IntegerField(null=True, blank=True, help_text="latidos por minuto - Opcional")
    
    # Laboratorios - CRÍTICOS para evaluación de riesgo
    colesterol = models.FloatField(help_text="mg/dL - OBLIGATORIO para predicción cardiovascular")
    colesterol_hdl = models.FloatField(null=True, blank=True, help_text="mg/dL - Opcional")
    colesterol_ldl = models.FloatField(null=True, blank=True, help_text="mg/dL - Opcional")
    trigliceridos = models.FloatField(null=True, blank=True, help_text="mg/dL - Opcional")
    glucosa = models.FloatField(help_text="mg/dL - OBLIGATORIO para predicción")
    hemoglobina_glicosilada = models.FloatField(null=True, blank=True, help_text="HbA1c % - Opcional")
    
    # Hábitos
    cigarrillos_dia = models.IntegerField(default=0)
    anos_tabaquismo = models.IntegerField(default=0)
    actividad_fisica = models.CharField(max_length=20, choices=ACTIVITY_CHOICES, default='sedentario')
    
    # Antecedentes
    antecedentes_cardiacos = models.CharField(max_length=20, choices=ANTECEDENTES_CHOICES, default='no')
    diabetes = models.BooleanField(default=False)
    hipertension = models.BooleanField(default=False)
    
    # Medicamentos y alergias
    medicamentos_actuales = models.JSONField(default=list, blank=True)
    alergias = models.JSONField(default=list, blank=True)
    
    # Observaciones
    observaciones = models.TextField(blank=True)
    
    # Integración externa
    external_record_id = models.CharField(max_length=100, blank=True, null=True)
    external_data = models.JSONField(default=dict, blank=True)
    
    # Metadatos
    fecha_registro = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_registro']
    
    def clean(self):
        """Validaciones comprehensivas del modelo MedicalRecord"""
        super().clean()
        errors = {}
        
        # Validar signos vitales críticos
        if self.presion_sistolica and self.presion_diastolica:
            if not (50 <= self.presion_sistolica <= 300):
                errors['presion_sistolica'] = "La presión sistólica debe estar entre 50 y 300 mmHg"
            
            if not (30 <= self.presion_diastolica <= 200):
                errors['presion_diastolica'] = "La presión diastólica debe estar entre 30 y 200 mmHg"
            
            if self.presion_diastolica >= self.presion_sistolica:
                errors['presion_arterial'] = "La presión sistólica debe ser mayor que la diastólica"
        
        # Validar frecuencia cardíaca
        if self.frecuencia_cardiaca:
            if not (40 <= self.frecuencia_cardiaca <= 200):
                errors['frecuencia_cardiaca'] = "La frecuencia cardíaca debe estar entre 40 y 200 latidos por minuto"
        
        # Validar laboratorios críticos
        if self.colesterol:
            if not (100 <= self.colesterol <= 500):
                errors['colesterol'] = "El colesterol debe estar entre 100 y 500 mg/dL"
        
        if self.glucosa:
            if not (50 <= self.glucosa <= 600):
                errors['glucosa'] = "La glucosa debe estar entre 50 y 600 mg/dL"
        
        # Validar consistencia de edad
        if self.patient and self.patient.fecha_nacimiento and self.edad:
            calculated_age = self.patient.age
            if calculated_age and abs(calculated_age - self.edad) > 1:
                errors['edad'] = f"La edad registrada ({self.edad}) no coincide con la calculada ({calculated_age})"
        
        # Validar hábitos
        if self.cigarrillos_dia < 0:
            errors['cigarrillos_dia'] = "Los cigarrillos por día no pueden ser negativos"
        
        if self.anos_tabaquismo < 0:
            errors['anos_tabaquismo'] = "Los años de tabaquismo no pueden ser negativos"
        
        if self.cigarrillos_dia > 0 and self.anos_tabaquismo == 0:
            errors['anos_tabaquismo'] = "Si fuma actualmente, debe indicar años de tabaquismo"
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones"""
        # Auto-calcular edad si no se proporciona
        if not self.edad and self.patient and self.patient.fecha_nacimiento:
            self.edad = self.patient.age
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Log de alertas médicas críticas
        self._log_medical_alerts()
    
    def _log_medical_alerts(self):
        """Registra alertas médicas críticas"""
        import logging
        logger = logging.getLogger('cardiovascular.medical_alerts')
        
        alerts = []
        
        # Alertas de presión arterial
        if self.presion_sistolica >= 180 or self.presion_diastolica >= 110:
            alerts.append(f"CRISIS HIPERTENSIVA: {self.presion_sistolica}/{self.presion_diastolica} mmHg")
        elif self.presion_sistolica >= 140 or self.presion_diastolica >= 90:
            alerts.append(f"HIPERTENSIÓN: {self.presion_sistolica}/{self.presion_diastolica} mmHg")
        
        # Alertas de glucosa
        if self.glucosa and self.glucosa >= 200:
            alerts.append(f"HIPERGLUCEMIA: {self.glucosa} mg/dL")
        elif self.glucosa and self.glucosa <= 70:
            alerts.append(f"HIPOGLUCEMIA: {self.glucosa} mg/dL")
        
        # Alertas de colesterol
        if self.colesterol and self.colesterol >= 240:
            alerts.append(f"COLESTEROL ALTO: {self.colesterol} mg/dL")
        
        # Alertas de frecuencia cardíaca (solo si tiene valor)
        if self.frecuencia_cardiaca is not None:
            if self.frecuencia_cardiaca < 60:
                alerts.append(f"BRADICARDIA: {self.frecuencia_cardiaca} lpm")
            elif self.frecuencia_cardiaca > 100:
                alerts.append(f"TAQUICARDIA: {self.frecuencia_cardiaca} lpm")
        
        # Alertas de colesterol HDL (solo si tiene valor)
        if self.colesterol_hdl is not None and self.colesterol_hdl < 40:
            alerts.append(f"COLESTEROL HDL BAJO: {self.colesterol_hdl} mg/dL")
        
        # Alertas de triglicéridos (solo si tiene valor)
        if self.trigliceridos is not None and self.trigliceridos >= 200:
            alerts.append(f"TRIGLICÉRIDOS ALTOS: {self.trigliceridos} mg/dL")
        
        # Alertas de hemoglobina glicosilada (solo si tiene valor)
        if self.hemoglobina_glicosilada is not None and self.hemoglobina_glicosilada >= 6.5:
            alerts.append(f"HEMOGLOBINA GLICOSILADA ALTA: {self.hemoglobina_glicosilada}%")
        
        # Registrar alertas
        for alert in alerts:
            logger.warning(f"PACIENTE {self.patient.dni} - {alert}")

    def __str__(self):
        return f"Registro médico - {self.patient.nombre_completo} - {self.fecha_registro.date()}"

    @property
    def presion_arterial(self):
        return f"{self.presion_sistolica}/{self.presion_diastolica}"
    
    @property
    def risk_indicators(self):
        """Devuelve indicadores de riesgo cardiovascular"""
        indicators = []
        
        if self.presion_sistolica >= 140 or self.presion_diastolica >= 90:
            indicators.append("Hipertensión")
        
        if self.glucosa and self.glucosa >= 126:
            indicators.append("Diabetes/Prediabetes")
        
        if self.colesterol and self.colesterol >= 200:
            indicators.append("Colesterol elevado")
        
        if self.cigarrillos_dia > 0:
            indicators.append("Tabaquismo activo")
        
        if self.actividad_fisica == 'sedentario':
            indicators.append("Sedentarismo")
        
        return indicators

    @property
    def indice_paquetes_ano(self):
        if self.cigarrillos_dia > 0 and self.anos_tabaquismo > 0:
            return round((self.cigarrillos_dia / 20) * self.anos_tabaquismo, 2)
        return 0

    @property
    def riesgo_diabetes(self):
        """Evaluar riesgo de diabetes basado en glucosa y HbA1c"""
        if self.hemoglobina_glicosilada and self.hemoglobina_glicosilada >= 6.5:
            return "Alto"
        elif self.glucosa and self.glucosa >= 126:
            return "Alto"
        elif self.glucosa and self.glucosa >= 100:
            return "Moderado"
        return "Bajo"
