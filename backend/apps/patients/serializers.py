from rest_framework import serializers
from .models import Patient, MedicalRecord
import requests
from django.conf import settings

class MedicalRecordSerializer(serializers.ModelSerializer):
    presion_arterial = serializers.ReadOnlyField()
    indice_paquetes_ano = serializers.ReadOnlyField()
    riesgo_diabetes = serializers.ReadOnlyField()
    patient_id = serializers.UUIDField(read_only=True, source='patient.id')

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'patient_id', 'fecha_registro',
            'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
            'colesterol', 'colesterol_hdl', 'colesterol_ldl', 'trigliceridos', 'glucosa', 'hemoglobina_glicosilada',
            'cigarrillos_dia', 'anos_tabaquismo', 'actividad_fisica',
            'antecedentes_cardiacos', 'diabetes', 'hipertension',
            'medicamentos_actuales', 'alergias',
            'observaciones', 'external_record_id', 'external_data',
            'created_at', 'presion_arterial', 'indice_paquetes_ano', 'riesgo_diabetes'
        ]
        read_only_fields = [
            'id', 'created_at', 'fecha_registro', 'presion_arterial', 
            'indice_paquetes_ano', 'riesgo_diabetes'
        ]
        
    def update(self, instance, validated_data):
        # Eliminar patient de validated_data si está presente para evitar que se actualice
        validated_data.pop('patient', None)
        return super().update(instance, validated_data)

class PatientSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    imc = serializers.ReadOnlyField()
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    latest_medical_record = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'sexo', 'peso', 'altura',
            'telefono', 'email', 'direccion', 'numero_historia', 'hospital',
            'medico_tratante', 'external_patient_id', 'external_system_data',
            'created_at', 'updated_at', 'is_active',
            'nombre_completo', 'imc', 'medical_records', 'latest_medical_record'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'nombre_completo', 'imc', 'medical_records', 'latest_medical_record']

    def get_latest_medical_record(self, obj):
        latest_record = obj.medical_records.order_by('-fecha_registro').first()
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
            'id', 'nombre_completo', 'dni', 'fecha_nacimiento', 'sexo', 'imc', 
            'numero_historia', 'ultimo_registro', 'riesgo_actual',
            'peso', 'altura',
            'telefono', 'email', 'direccion'
        ]

    def get_ultimo_registro(self, obj):
        latest_record = obj.medical_records.order_by('-fecha_registro').first()
        return latest_record.fecha_registro if latest_record else None

    def get_riesgo_actual(self, obj):
        try:
            from apps.predictions.models import Prediction
            latest_prediction = Prediction.objects.filter(patient=obj).order_by('-created_at').first()
            if latest_prediction:
                from apps.predictions.serializers import PredictionSerializer
                return PredictionSerializer(latest_prediction).data
            return None
        except Exception:
            return None

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'id', 'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'sexo', 'peso', 'altura',
            'telefono', 'email', 'direccion', 'numero_historia', 'hospital', 'medico_tratante',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        print("Datos validados en PatientCreateSerializer.create:", validated_data)
        # Si no se proporciona medico_tratante, asignar el usuario actual
        if 'medico_tratante' not in validated_data or not validated_data['medico_tratante']:
            request = self.context.get('request')
            if request and request.user:
                validated_data['medico_tratante'] = request.user
        return super().create(validated_data)

class PatientDNISearchSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=20)
    
    def validate_dni(self, value):
        return value
    
    def get_patient_data(self):
        dni = self.validated_data['dni']
        pacientes = Patient.objects.filter(dni=dni)
        if pacientes.count() == 1:
            patient = pacientes.first()
            return {
                'exists': True,
                'data': PatientSerializer(patient).data
            }
        elif pacientes.count() > 1:
            return {
                'error': f"Hay {pacientes.count()} pacientes con el mismo DNI. Contacte al administrador para resolver duplicados.",
                'exists': False,
                'data': None
            }
        else:
            return {
                'exists': False,
                'data': {
                    'dni': dni,
                    'nombre': '',
                    'apellidos': '',
                    'fecha_nacimiento': None,
                    'sexo': '',
                    'numero_historia': '',
                }
            }

# Serializador optimizado para la predicción masiva
class PatientForPredictionSerializer(serializers.ModelSerializer):
    """
    Serializador ligero que incluye los campos necesarios del paciente y los datos
    del último registro médico, obtenidos a través de anotaciones en la consulta.
    """
    presionSistolica = serializers.IntegerField(source='latest_sistolica', default=0)
    presionDiastolica = serializers.IntegerField(source='latest_diastolica', default=0)
    colesterol = serializers.FloatField(source='latest_colesterol', default=0.0)
    glucosa = serializers.FloatField(source='latest_glucosa', default=0.0)
    cigarrillosDia = serializers.IntegerField(source='latest_cigarrillos', default=0)
    anosTabaquismo = serializers.IntegerField(source='latest_tabaquismo', default=0)
    actividadFisica = serializers.CharField(source='latest_actividad', default='sedentario')
    antecedentesCardiacos = serializers.CharField(source='latest_antecedentes', default='no')
    
    class Meta:
        model = Patient
        fields = [
            'id', 'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'sexo', 'peso', 'altura',
            'numero_historia',
            # Campos anotados desde el último registro médico
            'presionSistolica', 'presionDiastolica', 'colesterol', 'glucosa',
            'cigarrillosDia', 'anosTabaquismo', 'actividadFisica', 'antecedentesCardiacos'
        ]
