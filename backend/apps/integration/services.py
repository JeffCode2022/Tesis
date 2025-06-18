import requests
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from .models import ExternalSystemIntegration, IntegrationLog
from apps.patients.models import Patient, MedicalRecord

logger = logging.getLogger('cardiovascular')

class ExternalSystemService:
    """Servicio para integración con sistemas externos del policlínico"""
    
    def __init__(self, integration_config: ExternalSystemIntegration):
        self.config = integration_config
        self.session = requests.Session()
        self._setup_authentication()
    
    def _setup_authentication(self):
        """Configurar autenticación para el sistema externo"""
        if self.config.api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {self.config.api_key}',
                'Content-Type': 'application/json'
            })
        elif self.config.username and self.config.password:
            self.session.auth = (self.config.username, self.config.password)
    
    def fetch_patient_data(self, external_patient_id: str) -> Optional[Dict[str, Any]]:
        """Obtener datos del paciente desde sistema externo"""
        try:
            url = f"{self.config.base_url}{self.config.patient_endpoint}{external_patient_id}/"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self._log_integration('IMPORT', f'Paciente {external_patient_id} obtenido exitosamente', data)
                return self._map_patient_data(data)
            else:
                self._log_integration('ERROR', f'Error obteniendo paciente {external_patient_id}: {response.status_code}')
                return None
                
        except Exception as e:
            self._log_integration('ERROR', f'Error de conexión obteniendo paciente {external_patient_id}: {str(e)}')
            return None
    
    def fetch_medical_records(self, external_patient_id: str) -> List[Dict[str, Any]]:
        """Obtener registros médicos desde sistema externo"""
        try:
            url = f"{self.config.base_url}{self.config.medical_record_endpoint}"
            params = {'patient_id': external_patient_id}
            response = self.session.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                records = data if isinstance(data, list) else data.get('results', [])
                
                mapped_records = [self._map_medical_record_data(record) for record in records]
                self._log_integration('IMPORT', f'{len(mapped_records)} registros médicos obtenidos para paciente {external_patient_id}')
                return mapped_records
            else:
                self._log_integration('ERROR', f'Error obteniendo registros médicos: {response.status_code}')
                return []
                
        except Exception as e:
            self._log_integration('ERROR', f'Error obteniendo registros médicos: {str(e)}')
            return []
    
    def _map_patient_data(self, external_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapear datos del paciente desde formato externo"""
        mapping = self.config.field_mapping.get('patient', {})
        
        # Mapeo por defecto si no hay configuración específica
        default_mapping = {
            'nombre': ['first_name', 'nombre', 'name'],
            'apellidos': ['last_name', 'apellidos', 'surname'],
            'edad': ['age', 'edad'],
            'sexo': ['gender', 'sexo', 'sex'],
            'peso': ['weight', 'peso'],
            'altura': ['height', 'altura', 'estatura'],
            'telefono': ['phone', 'telefono', 'telephone'],
            'email': ['email', 'correo'],
            'direccion': ['address', 'direccion'],
            'numero_historia': ['medical_record_number', 'numero_historia', 'historia_clinica'],
        }
        
        mapped_data = {}
        
        for field, possible_keys in default_mapping.items():
            # Usar mapeo personalizado si existe
            if field in mapping:
                external_key = mapping[field]
                if external_key in external_data:
                    mapped_data[field] = external_data[external_key]
            else:
                # Buscar en claves posibles
                for key in possible_keys:
                    if key in external_data:
                        mapped_data[field] = external_data[key]
                        break
        
        # Normalizar sexo
        if 'sexo' in mapped_data:
            sexo = str(mapped_data['sexo']).upper()
            if sexo in ['M', 'MALE', 'MASCULINO', '1']:
                mapped_data['sexo'] = 'M'
            elif sexo in ['F', 'FEMALE', 'FEMENINO', '0']:
                mapped_data['sexo'] = 'F'
        
        # Agregar datos externos originales
        mapped_data['external_system_data'] = external_data
        
        return mapped_data
    
    def _map_medical_record_data(self, external_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapear datos del registro médico desde formato externo"""
        mapping = self.config.field_mapping.get('medical_record', {})
        
        default_mapping = {
            'presion_sistolica': ['systolic_bp', 'presion_sistolica', 'systolic'],
            'presion_diastolica': ['diastolic_bp', 'presion_diastolica', 'diastolic'],
            'frecuencia_cardiaca': ['heart_rate', 'frecuencia_cardiaca', 'pulse'],
            'colesterol': ['cholesterol', 'colesterol_total', 'total_cholesterol'],
            'colesterol_hdl': ['hdl_cholesterol', 'colesterol_hdl', 'hdl'],
            'colesterol_ldl': ['ldl_cholesterol', 'colesterol_ldl', 'ldl'],
            'trigliceridos': ['triglycerides', 'trigliceridos'],
            'glucosa': ['glucose', 'glucosa', 'blood_glucose'],
            'hemoglobina_glicosilada': ['hba1c', 'hemoglobina_glicosilada', 'glycated_hemoglobin'],
            'cigarrillos_dia': ['cigarettes_per_day', 'cigarrillos_dia'],
            'anos_tabaquismo': ['smoking_years', 'anos_tabaquismo'],
            'actividad_fisica': ['physical_activity', 'actividad_fisica'],
            'diabetes': ['diabetes', 'has_diabetes'],
            'hipertension': ['hypertension', 'hipertension', 'has_hypertension'],
        }
        
        mapped_data = {}
        
        for field, possible_keys in default_mapping.items():
            if field in mapping:
                external_key = mapping[field]
                if external_key in external_data:
                    mapped_data[field] = external_data[external_key]
            else:
                for key in possible_keys:
                    if key in external_data:
                        mapped_data[field] = external_data[key]
                        break
        
        # Normalizar valores booleanos
        for bool_field in ['diabetes', 'hipertension']:
            if bool_field in mapped_data:
                value = mapped_data[bool_field]
                if isinstance(value, str):
                    mapped_data[bool_field] = value.lower() in ['true', 'yes', 'si', '1']
                else:
                    mapped_data[bool_field] = bool(value)
        
        # Agregar datos externos originales
        mapped_data['external_data'] = external_data
        
        return mapped_data
    
    def _log_integration(self, log_type: str, message: str, data: Dict = None):
        """Registrar log de integración"""
        try:
            IntegrationLog.objects.create(
                integration=self.config,
                log_type=log_type,
                message=message,
                data=data or {},
                success=log_type != 'ERROR'
            )
        except Exception as e:
            logger.error(f"Error creando log de integración: {e}")

class PolyclinicoIntegrationService:
    """Servicio específico para integración con el sistema del Policlínico Laura Caller"""
    
    @staticmethod
    def import_patient_from_external(external_patient_id: str, integration_name: str = None) -> Optional[Patient]:
        """Importar paciente desde sistema externo"""
        try:
            # Obtener configuración de integración
            if integration_name:
                integration = ExternalSystemIntegration.objects.get(name=integration_name, is_active=True)
            else:
                integration = ExternalSystemIntegration.objects.filter(is_active=True).first()
            
            if not integration:
                logger.error("No hay configuración de integración activa")
                return None
            
            # Crear servicio de integración
            service = ExternalSystemService(integration)
            
            # Obtener datos del paciente
            patient_data = service.fetch_patient_data(external_patient_id)
            if not patient_data:
                return None
            
            # Verificar si el paciente ya existe
            existing_patient = Patient.objects.filter(
                external_patient_id=external_patient_id
            ).first()
            
            if existing_patient:
                # Actualizar datos existentes
                for field, value in patient_data.items():
                    if field != 'external_system_data' and hasattr(existing_patient, field):
                        setattr(existing_patient, field, value)
                existing_patient.external_system_data.update(patient_data.get('external_system_data', {}))
                existing_patient.save()
                patient = existing_patient
            else:
                # Crear nuevo paciente
                patient_data['external_patient_id'] = external_patient_id
                patient = Patient.objects.create(**patient_data)
            
            # Importar registros médicos
            medical_records_data = service.fetch_medical_records(external_patient_id)
            for record_data in medical_records_data:
                record_data['patient'] = patient
                MedicalRecord.objects.create(**record_data)
            
            logger.info(f"Paciente {external_patient_id} importado exitosamente")
            return patient
            
        except Exception as e:
            logger.error(f"Error importando paciente {external_patient_id}: {e}")
            return None
    
    @staticmethod
    def sync_patient_data(patient: Patient) -> bool:
        """Sincronizar datos del paciente con sistema externo"""
        if not patient.external_patient_id:
            return False
        
        try:
            integration = ExternalSystemIntegration.objects.filter(is_active=True).first()
            if not integration:
                return False
            
            service = ExternalSystemService(integration)
            
            # Obtener datos actualizados
            updated_data = service.fetch_patient_data(patient.external_patient_id)
            if updated_data:
                # Actualizar paciente
                for field, value in updated_data.items():
                    if field != 'external_system_data' and hasattr(patient, field):
                        setattr(patient, field, value)
                patient.external_system_data.update(updated_data.get('external_system_data', {}))
                patient.save()
                
                # Sincronizar registros médicos
                medical_records_data = service.fetch_medical_records(patient.external_patient_id)
                for record_data in medical_records_data:
                    # Verificar si el registro ya existe
                    external_id = record_data.get('external_data', {}).get('id')
                    if external_id:
                        existing_record = MedicalRecord.objects.filter(
                            patient=patient,
                            external_record_id=external_id
                        ).first()
                        
                        if not existing_record:
                            record_data['patient'] = patient
                            record_data['external_record_id'] = external_id
                            MedicalRecord.objects.create(**record_data)
                
                return True
            
        except Exception as e:
            logger.error(f"Error sincronizando paciente {patient.id}: {e}")
        
        return False
