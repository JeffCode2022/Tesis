from django.db import models
from apps.patients.models import Patient, MedicalRecord
import uuid

class Prediction(models.Model):
    RISK_LEVELS = [
        ('Bajo', 'Bajo Riesgo'),
        ('Medio', 'Riesgo Medio'),
        ('Alto', 'Alto Riesgo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='predictions')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE)
    
    # Resultados de predicción
    riesgo_nivel = models.CharField(max_length=10, choices=RISK_LEVELS)
    probabilidad = models.FloatField(help_text="Probabilidad en porcentaje (0-100)")
    
    # Análisis detallado
    factores_riesgo = models.JSONField(default=list)
    recomendaciones = models.JSONField(default=list)
    scores_detallados = models.JSONField(default=dict, help_text="Scores por categoría")
    
    # Información del modelo
    model_version = models.CharField(max_length=50, default='v1.0.0')
    confidence_score = models.FloatField(default=0.0)
    features_used = models.JSONField(default=dict)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Integración externa
    external_prediction_id = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['riesgo_nivel']),
        ]

    def __str__(self):
        return f"Predicción {self.patient.nombre_completo} - {self.riesgo_nivel} ({self.probabilidad}%)"

class ModelPerformance(models.Model):
    model_version = models.CharField(max_length=50)
    accuracy = models.FloatField()
    precision = models.FloatField()
    recall = models.FloatField()
    f1_score = models.FloatField()
    roc_auc = models.FloatField()
    total_predictions = models.IntegerField(default=0)
    correct_predictions = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Performance {self.model_version} - Accuracy: {self.accuracy:.3f}"
