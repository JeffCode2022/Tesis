from rest_framework import serializers
from .models import Patient, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    presion_arterial = serializers.ReadOnlyField()
    indice_paquetes_ano = serializers.ReadOnlyField()
    riesgo_diabetes = serializers.ReadOnlyField()

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
            'colesterol', 'colesterol_hdl', 'colesterol_ldl', 'trigliceridos', 'glucosa',
            'hemoglobina_glicosilada', 'cigarrillos_dia', 'anos_tabaquismo', 'actividad_fisica',
            'antecedentes_cardiacos', 'diabetes', 'hipertension', 'medicamentos_actuales',
            'alergias', 'observaciones', 'external_record_id', 'external_data',
            'fecha_registro', 'created_at', 'presion_arterial', 'indice_paquetes_ano',
            'riesgo_diabetes'
        ]
        read_only_fields = [
            'id', 'created_at', 'fecha_registro', 'presion_arterial',
            'indice_paquetes_ano', 'riesgo_diabetes'
        ]

    def create(self, validated_data):
        print("Datos validados para crear:", validated_data)
        # Asegurarse de que los campos JSON tengan valores por defecto
        if 'medicamentos_actuales' not in validated_data:
            validated_data['medicamentos_actuales'] = []
        if 'alergias' not in validated_data:
            validated_data['alergias'] = []
        if 'external_data' not in validated_data:
            validated_data['external_data'] = {}
        
        # Convertir campos booleanos
        for field in ['diabetes', 'hipertension']:
            if field in validated_data:
                validated_data[field] = bool(validated_data[field])
        
        return super().create(validated_data)

    def validate(self, attrs):
        print("Datos recibidos en validación:", attrs)
        return attrs

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
            'id', 'nombre', 'apellidos', 'edad', 'sexo', 'peso', 
            'altura', 'email', 'telefono', 'direccion', 'hospital',
            'numero_historia'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        print("Datos validados en PatientCreateSerializer.create:", validated_data)
        return super().create(validated_data)
