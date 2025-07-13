from django.db import models
import uuid
from django.utils import timezone
from django.conf import settings

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
    fecha_nacimiento = models.DateField(null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=GENDER_CHOICES)
    peso = models.FloatField(help_text="Peso en kilogramos")
    altura = models.FloatField(help_text="Altura en centímetros")
    
    # Información de contacto
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    
    # Información médica
    numero_historia = models.CharField(max_length=50, unique=True)
    hospital = models.CharField(max_length=200, default="Policlínico Laura Caller")
    medico_tratante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients_treated')
    
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
    edad = models.IntegerField(help_text="Edad del paciente en años", null=True, blank=True)
    
    # Signos vitales
    presion_sistolica = models.IntegerField(help_text="mmHg")
    presion_diastolica = models.IntegerField(help_text="mmHg")
    frecuencia_cardiaca = models.IntegerField(null=True, blank=True, help_text="latidos por minuto")
    
    # Laboratorios
    colesterol = models.FloatField(null=True, blank=True, help_text="mg/dL")
    colesterol_hdl = models.FloatField(null=True, blank=True, help_text="mg/dL")
    colesterol_ldl = models.FloatField(null=True, blank=True, help_text="mg/dL")
    trigliceridos = models.FloatField(null=True, blank=True, help_text="mg/dL")
    glucosa = models.FloatField(null=True, blank=True, help_text="mg/dL")
    hemoglobina_glicosilada = models.FloatField(null=True, blank=True, help_text="HbA1c %")
    
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

    def __str__(self):
        return f"Registro médico - {self.patient.nombre_completo} - {self.fecha_registro.date()}"

    @property
    def presion_arterial(self):
        return f"{self.presion_sistolica}/{self.presion_diastolica}"

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
