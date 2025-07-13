from django.db import models
from apps.patients.models import Patient

class MedicalData(models.Model):
    """Modelo para almacenar datos médicos de los pacientes."""
    
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='medical_data_records',
        verbose_name='Paciente'
    )
    date_recorded = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    age = models.IntegerField(verbose_name='Edad')
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        verbose_name='Género'
    )
    smoking = models.BooleanField(
        default=False,
        verbose_name='Fumador'
    )
    alcohol_consumption = models.BooleanField(
        default=False,
        verbose_name='Consumo de alcohol'
    )
    physical_activity = models.BooleanField(
        default=False,
        verbose_name='Actividad física'
    )
    systolic_pressure = models.FloatField(
        verbose_name='Presión sistólica'
    )
    diastolic_pressure = models.FloatField(
        verbose_name='Presión diastólica'
    )
    heart_rate = models.IntegerField(
        verbose_name='Frecuencia cardíaca'
    )
    cholesterol = models.FloatField(
        verbose_name='Colesterol'
    )
    glucose = models.FloatField(
        verbose_name='Glucosa'
    )
    family_history = models.BooleanField(
        default=False,
        verbose_name='Antecedentes familiares'
    )
    previous_conditions = models.TextField(
        blank=True,
        verbose_name='Condiciones previas'
    )
    risk_score = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Puntuación de riesgo'
    )
    prediction_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de predicción'
    )
    
    class Meta:
        verbose_name = 'Dato Médico'
        verbose_name_plural = 'Datos Médicos'
        ordering = ['-date_recorded']
    
    def __str__(self):
        return f"Datos médicos de {self.patient} - {self.date_recorded.strftime('%Y-%m-%d')}"
