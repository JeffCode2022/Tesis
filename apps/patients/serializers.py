from rest_framework import serializers
from .models import Patient, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    presion_arterial = serializers.ReadOnlyField()
    indice_paquetes_ano = serializers.ReadOnlyField()
    riesgo_diabetes = serializers.ReadOnlyField()

    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class PatientSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    imc = serializers.ReadOnlyField()
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    latest_medical_record = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_latest_medical_record(self, obj):
        latest_record = obj.medical_records.first()
        if latest_record:
            return MedicalRecordSerializer(latest_record).data
        return None

class PatientListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    imc = serializers.ReadOnlyField()
    ultimo_registro = serializers.SerializerMethodField()
    riesgo_actual = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'nombre_completo', 'edad', 'sexo', 'imc', 
            'numero_historia', 'ultimo_registro', 'riesgo_actual'
        ]

    def get_ultimo_registro(self, obj):
        latest_record = obj.medical_records.first()
        return latest_record.fecha_registro if latest_record else None

    def get_riesgo_actual(self, obj):
        from apps.predictions.models import Prediction
        latest_prediction = Prediction.objects.filter(patient=obj).first()
        return latest_prediction.riesgo_nivel if latest_prediction else None

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'nombre', 'apellidos', 'fecha_nacimiento', 'sexo', 'peso', 
            'altura', 'email', 'telefono', 'direccion', 'hospital'
        ]
