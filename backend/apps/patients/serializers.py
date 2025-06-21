from rest_framework import serializers
from .models import Patient, MedicalRecord
import requests
from django.conf import settings

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
            'id', 'nombre_completo', 'dni', 'edad', 'sexo', 'imc', 
            'numero_historia', 'ultimo_registro', 'riesgo_actual'
        ]

    def get_ultimo_registro(self, obj):
        latest_record = obj.medical_records.first()
        return latest_record.fecha_registro if latest_record else None

    def get_riesgo_actual(self, obj):
        try:
            from apps.predictions.models import Prediction
            latest_prediction = Prediction.objects.filter(patient=obj).first()
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
            'id', 'nombre', 'apellidos', 'dni', 'edad', 'sexo', 'peso', 
            'altura', 'email', 'telefono', 'direccion', 'hospital',
            'numero_historia'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        print("Datos validados en PatientCreateSerializer.create:", validated_data)
        return super().create(validated_data)

class PatientDNISearchSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=20)
    
    def validate_dni(self, value):
        # Aquí puedes agregar validación adicional del DNI si es necesario
        return value
    
    def get_patient_data(self):
        dni = self.validated_data['dni']
        try:
            # Intentar obtener datos del paciente existente
            patient = Patient.objects.get(dni=dni)
            return {
                'exists': True,
                'data': PatientSerializer(patient).data
            }
        except Patient.DoesNotExist:
            # Si no existe, intentar obtener datos del sistema externo
            try:
                # Aquí puedes agregar la lógica para obtener datos del sistema externo
                # Por ejemplo, usando una API externa
                external_data = self._get_external_data(dni)
                return {
                    'exists': False,
                    'data': external_data
                }
            except Exception as e:
                return {
                    'exists': False,
                    'error': str(e)
                }
    
    def _get_external_data(self, dni):
        # Aquí puedes implementar la lógica para obtener datos del sistema externo
        # Por ejemplo, usando una API externa
        # Este es un ejemplo, deberás adaptarlo a tu sistema externo
        try:
            # Ejemplo de llamada a API externa
            response = requests.get(
                f"{settings.EXTERNAL_API_URL}/patients/{dni}",
                headers={"Authorization": f"Bearer {settings.EXTERNAL_API_TOKEN}"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Mapear los datos externos al formato de tu modelo
            return {
                'dni': dni,
                'nombre': data.get('nombre', ''),
                'apellidos': data.get('apellidos', ''),
                'edad': data.get('edad'),
                'sexo': data.get('sexo'),
                'numero_historia': data.get('numero_historia', ''),
                # Agregar otros campos según sea necesario
            }
        except Exception as e:
            raise serializers.ValidationError(f"Error al obtener datos externos: {str(e)}")

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
            'nombre', 'apellidos', 'dni', 'edad', 'sexo', 'peso', 'altura',
            'numero_historia',
            # Campos anotados desde el último registro médico
            'presionSistolica', 'presionDiastolica', 'colesterol', 'glucosa',
            'cigarrillosDia', 'anosTabaquismo', 'actividadFisica', 'antecedentesCardiacos'
        ]
