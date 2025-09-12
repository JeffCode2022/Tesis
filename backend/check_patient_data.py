#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('c:/Users/CHUNGA/Desktop/SISTEMA DE PREDICTION/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cardiovascular_project.settings')
django.setup()

from apps.patients.models import Patient, MedicalRecord

def check_patient_data():
    try:
        # Buscar paciente por DNI
        patient = Patient.objects.get(dni='10102020')
        print('=== PACIENTE ENCONTRADO ===')
        print(f'ID: {patient.id}')
        print(f'Nombre: {patient.nombre}')
        print(f'Apellidos: {patient.apellidos}')
        print(f'DNI: {patient.dni}')
        print(f'Teléfono: {patient.telefono}')
        print(f'Email: {patient.email}')
        print(f'Dirección: {patient.direccion}')
        print(f'Hospital: {patient.hospital}')
        print(f'Médico tratante: {patient.medico_tratante}')
        print(f'Número historia: {patient.numero_historia}')
        print(f'Estado activo: {patient.is_active}')
        print(f'ID externo: {patient.external_patient_id}')
        print(f'Datos externos: {patient.external_system_data}')

        # Buscar registros médicos
        medical_records = MedicalRecord.objects.filter(patient=patient).order_by('-fecha_registro')
        print(f'\n=== REGISTROS MÉDICOS ({len(medical_records)}) ===')

        for i, record in enumerate(medical_records[:3]):  # Mostrar los 3 más recientes
            print(f'\n--- Registro {i+1} ---')
            print(f'ID: {record.id}')
            print(f'Fecha: {record.fecha_registro}')
            print(f'Presión: {record.presion_sistolica}/{record.presion_diastolica}')
            print(f'Frecuencia cardíaca: {record.frecuencia_cardiaca}')
            print(f'Colesterol: {record.colesterol}')
            print(f'Glucosa: {record.glucosa}')
            print(f'Cigarrillos/día: {record.cigarrillos_dia}')
            print(f'Años tabaquismo: {record.anos_tabaquismo}')
            print(f'Indice paquetes/año: {record.indice_paquetes_ano}')
            print(f'Riesgo diabetes: {record.riesgo_diabetes}')
            print(f'ID externo registro: {record.external_record_id}')
            print(f'Datos externos: {record.external_data}')

    except Patient.DoesNotExist:
        print('PACIENTE CON DNI 10102020 NO ENCONTRADO')
        # Mostrar todos los pacientes disponibles
        all_patients = Patient.objects.all()[:5]
        print(f'\n=== PACIENTES DISPONIBLES ({len(all_patients)}) ===')
        for p in all_patients:
            print(f'DNI: {p.dni}, Nombre: {p.nombre} {p.apellidos}')
    except Exception as e:
        print(f'ERROR: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_patient_data()
