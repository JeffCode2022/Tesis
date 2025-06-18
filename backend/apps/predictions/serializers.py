from rest_framework import serializers
from .models import Prediction, ModelPerformance

class PredictionSerializer(serializers.ModelSerializer):
    nombre_paciente = serializers.CharField(source='patient.nombre_completo', read_only=True)
    ultimo_registro = serializers.DateTimeField(source='medical_record.fecha_registro', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'nombre_paciente', 'ultimo_registro', 'riesgo_nivel',
            'probabilidad', 'factores_riesgo', 'recomendaciones',
            'scores_detallados', 'confidence_score', 'model_version',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ModelPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelPerformance
        fields = [
            'model_version', 'accuracy', 'precision', 'recall',
            'f1_score', 'roc_auc', 'total_predictions',
            'correct_predictions', 'created_at'
        ]
        read_only_fields = ['created_at']
