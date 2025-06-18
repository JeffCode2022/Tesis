from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

# Importar PredictionService para usar el modelo de predicción
from apps.predictions.services import PredictionService

class MedicalData(models.Model):
    """Modelo para almacenar datos médicos de pacientes."""
    
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='medical_data_records')
    date_recorded = models.DateTimeField(auto_now_add=True)
    
    # Datos demográficos
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=[
        ('M', _('Masculino')),
        ('F', _('Femenino')),
        ('O', _('Otro'))
    ])
    
    # Factores de riesgo
    smoking = models.BooleanField(default=False)
    alcohol_consumption = models.BooleanField(default=False)
    physical_activity = models.BooleanField(default=False)
    
    # Mediciones clínicas
    systolic_pressure = models.FloatField()
    diastolic_pressure = models.FloatField()
    heart_rate = models.IntegerField()
    cholesterol = models.FloatField()
    glucose = models.FloatField()
    
    # Historial médico
    family_history = models.BooleanField(default=False)
    previous_conditions = models.TextField(blank=True)
    
    # Resultados de predicción
    risk_score = models.FloatField(null=True, blank=True)
    prediction_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('Dato Médico')
        verbose_name_plural = _('Datos Médicos')
        ordering = ['-date_recorded']
    
    def __str__(self):
        return f"Registro médico de {self.patient} - {self.date_recorded.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        # Lógica de predicción automática
        super().save(*args, **kwargs)  # Guardar primero para asegurar que tiene ID
        try:
            predictor = PredictionService()
            # Usamos self como medical_record, y self.patient
            # El método espera un objeto tipo MedicalRecord, pero adaptamos los campos necesarios
            prediction = predictor.get_prediction(self.patient, self)
            if hasattr(prediction, 'probabilidad'):
                self.risk_score = prediction.probabilidad
                self.prediction_date = timezone.now()
                super().save(update_fields=['risk_score', 'prediction_date'])
        except Exception as e:
            # Si falla la predicción, no interrumpe el guardado
            pass 