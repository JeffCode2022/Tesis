from rest_framework import serializers
from .models import MedicalData

class MedicalDataSerializer(serializers.ModelSerializer):
    """Serializador para el modelo MedicalData."""
    
    class Meta:
        model = MedicalData
        fields = [
            'id', 'patient', 'date_recorded', 'age', 'gender',
            'smoking', 'alcohol_consumption', 'physical_activity',
            'systolic_pressure', 'diastolic_pressure', 'heart_rate',
            'cholesterol', 'glucose', 'family_history',
            'previous_conditions', 'risk_score', 'prediction_date'
        ]
        read_only_fields = ['id', 'date_recorded', 'risk_score', 'prediction_date'] 