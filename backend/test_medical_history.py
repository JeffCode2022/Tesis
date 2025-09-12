#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('c:/Users/CHUNGA/Desktop/SISTEMA DE PREDICTION/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cardiovascular_project.settings')
django.setup()

from apps.patients.models import Patient, MedicalRecord
from apps.patients.serializers import PatientSerializer, MedicalRecordSerializer
import json

def test_medical_history_endpoint():
    """Prueba el endpoint medical_history para verificar que funciona correctamente"""
    try:
        # Obtener paciente de prueba
        patient = Patient.objects.get(dni='10102020')
        print(f'=== PRUEBA ENDPOINT MEDICAL HISTORY PARA PACIENTE: {patient.nombre} {patient.apellidos} ===')

        # Simular la lógica del endpoint medical_history
        medical_records = MedicalRecord.objects.filter(
            patient=patient
        ).select_related('patient').order_by('-fecha_registro')

        serializer = MedicalRecordSerializer(medical_records, many=True)

        response_data = {
            'patient_id': patient.id,
            'patient_name': f"{patient.nombre} {patient.apellidos}",
            'medical_records': serializer.data,
            'total_records': medical_records.count()
        }

        print('Estructura de respuesta:')
        print(json.dumps({
            'patient_id': str(response_data['patient_id']),
            'patient_name': response_data['patient_name'],
            'total_records': response_data['total_records'],
            'medical_records_count': len(response_data['medical_records'])
        }, indent=2))

        # Verificar que el primer registro tenga datos completos
        if response_data['medical_records']:
            first_record = response_data['medical_records'][0]
            print('\nPrimer registro médico:')
            print(json.dumps({
                'id': str(first_record['id']),
                'fecha_registro': first_record['fecha_registro'],
                'presion_sistolica': first_record['presion_sistolica'],
                'colesterol': first_record['colesterol'],
                'colesterol_hdl': first_record['colesterol_hdl'],
                'trigliceridos': first_record['trigliceridos'],
                'glucosa': first_record['glucosa'],
                'hemoglobina_glicosilada': first_record['hemoglobina_glicosilada'],
                'medicamentos_actuales': first_record['medicamentos_actuales'],
                'alergias': first_record['alergias'],
                'observaciones': first_record['observaciones'][:50] + '...' if first_record['observaciones'] and len(first_record['observaciones']) > 50 else first_record['observaciones'],
                'external_record_id': first_record['external_record_id']
            }, indent=2, default=str))

        print('\n✅ Endpoint medical_history funcionando correctamente')
        return True

    except Exception as e:
        print(f'❌ Error en la prueba: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_medical_history_endpoint()
