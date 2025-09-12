"""
Servicios de negocio para el módulo de pacientes
"""
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from django.utils import timezone
from typing import Dict, Any, Optional
import logging
import datetime
from decimal import Decimal, InvalidOperation

from .models import Patient
from apps.medical_data.models import MedicalRecord, MedicalData

logger = logging.getLogger('cardiovascular.patients')


class PatientService:
    """Servicio para operaciones de negocio relacionadas con pacientes"""
    
    def create_patient(self, patient_data: Dict[str, Any], medico) -> Patient:
        """
        Crea un nuevo paciente con validaciones de negocio
        
        Args:
            patient_data: Diccionario con datos del paciente
            medico: Usuario médico tratante
            
        Returns:
            Patient: Instancia del paciente creado
            
        Raises:
            ValidationError: Si los datos son inválidos
        """
        try:
            # Validar fecha de nacimiento
            if isinstance(patient_data.get('fecha_nacimiento'), str):
                try:
                    fecha_nacimiento = datetime.datetime.strptime(
                        patient_data['fecha_nacimiento'], '%Y-%m-%d'
                    ).date()
                    patient_data['fecha_nacimiento'] = fecha_nacimiento
                except ValueError as e:
                    logger.error(f"Fecha de nacimiento inválida: {patient_data.get('fecha_nacimiento')}")
                    raise ValidationError("Formato de fecha de nacimiento inválido")
            
            # Validar edad mínima y máxima
            if patient_data.get('fecha_nacimiento'):
                today = datetime.date.today()
                age = today.year - patient_data['fecha_nacimiento'].year
                if age < 0 or age > 120:
                    raise ValidationError("La edad debe estar entre 0 y 120 años")
            
            # Validar DNI único
            if Patient.objects.filter(dni=patient_data.get('dni')).exists():
                raise ValidationError(f"Ya existe un paciente con DNI {patient_data.get('dni')}")
            
            # Crear paciente
            patient = Patient.objects.create(
                **patient_data,
                medico_tratante=medico
            )
            
            logger.info(f"Paciente creado exitosamente: {patient.dni} - {patient.nombres} {patient.apellidos}")
            return patient
            
        except Exception as e:
            logger.error(f"Error creando paciente: {str(e)}")
            raise
    
    def update_patient(self, patient: Patient, updated_data: Dict[str, Any]) -> Patient:
        """
        Actualiza un paciente existente
        
        Args:
            patient: Instancia del paciente a actualizar
            updated_data: Datos a actualizar
            
        Returns:
            Patient: Paciente actualizado
        """
        try:
            for field, value in updated_data.items():
                if hasattr(patient, field):
                    # Validación especial para fecha de nacimiento
                    if field == 'fecha_nacimiento' and isinstance(value, str):
                        try:
                            value = datetime.datetime.strptime(value, '%Y-%m-%d').date()
                        except ValueError:
                            logger.error(f"Formato de fecha inválido: {value}")
                            continue
                    
                    setattr(patient, field, value)
            
            patient.full_clean()
            patient.save()
            
            logger.info(f"Paciente actualizado: {patient.dni} - {patient.nombres} {patient.apellidos}")
            return patient
            
        except Exception as e:
            logger.error(f"Error actualizando paciente {patient.id}: {str(e)}")
            raise
    
    def delete_patient(self, patient: Patient) -> bool:
        """
        Elimina un paciente y sus datos relacionados
        
        Args:
            patient: Paciente a eliminar
            
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            patient_info = f"{patient.dni} - {patient.nombres} {patient.apellidos}"
            patient.delete()
            logger.info(f"Paciente eliminado: {patient_info}")
            return True
            
        except Exception as e:
            logger.error(f"Error eliminando paciente {patient.id}: {str(e)}")
            raise
    
    def get_patient_by_dni(self, dni: str) -> Optional[Patient]:
        """
        Busca un paciente por DNI
        
        Args:
            dni: Documento de identidad
            
        Returns:
            Patient: Paciente encontrado o None
        """
        try:
            return Patient.objects.get(dni=dni)
        except Patient.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error buscando paciente por DNI {dni}: {str(e)}")
            return None
    
    def get_patient_statistics(self, medico=None) -> Dict[str, Any]:
        """
        Obtiene estadísticas de pacientes
        
        Args:
            medico: Usuario médico (opcional, para filtrar)
            
        Returns:
            Dict: Estadísticas de pacientes
        """
        try:
            queryset = Patient.objects.all()
            if medico and not medico.is_staff:
                queryset = queryset.filter(medico_tratante=medico)
            
            # Estadísticas básicas
            total_patients = queryset.count()
            
            # Distribución por sexo
            gender_distribution = queryset.values('sexo').annotate(
                count=Count('id')
            ).order_by('sexo')
            
            # Grupos etarios
            today = datetime.date.today()
            age_groups = {
                'jovenes': 0,  # 18-30
                'adultos': 0,  # 31-50
                'mayores': 0,  # 51-70
                'ancianos': 0  # 70+
            }
            
            for patient in queryset.select_related():
                if patient.fecha_nacimiento:
                    age = today.year - patient.fecha_nacimiento.year
                    if age <= 30:
                        age_groups['jovenes'] += 1
                    elif age <= 50:
                        age_groups['adultos'] += 1
                    elif age <= 70:
                        age_groups['mayores'] += 1
                    else:
                        age_groups['ancianos'] += 1
            
            # Pacientes con registros médicos recientes (último mes)
            last_month = today - datetime.timedelta(days=30)
            recent_records = queryset.filter(
                medical_records__fecha_registro__gte=last_month
            ).distinct().count()
            
            return {
                'total_patients': total_patients,
                'gender_distribution': list(gender_distribution),
                'age_groups': age_groups,
                'patients_with_recent_records': recent_records,
                'activity_rate': round((recent_records / total_patients * 100), 2) if total_patients > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de pacientes: {str(e)}")
            return {}
    
    def create_medical_record(self, patient: Patient, medical_data: Dict[str, Any]) -> MedicalRecord:
        """
        Crea un nuevo registro médico para un paciente
        
        Args:
            patient: Paciente
            medical_data: Datos médicos
            
        Returns:
            MedicalRecord: Registro médico creado
        """
        try:
            # Validaciones específicas
            peso = medical_data.get('peso')
            if peso:
                try:
                    peso = Decimal(str(peso))
                    if peso <= 0 or peso > 500:  # Límites razonables
                        raise ValidationError("El peso debe estar entre 0 y 500 kg")
                except (InvalidOperation, ValueError):
                    raise ValidationError("El peso debe ser un número válido")
            
            altura = medical_data.get('altura')
            if altura:
                try:
                    altura = Decimal(str(altura))
                    if altura <= 0 or altura > 3:  # Límites razonables en metros
                        raise ValidationError("La altura debe estar entre 0 y 3 metros")
                except (InvalidOperation, ValueError):
                    raise ValidationError("La altura debe ser un número válido")
            
            # Validar presiones arteriales
            presion_sistolica = medical_data.get('presion_sistolica', 0)
            presion_diastolica = medical_data.get('presion_diastolica', 0)
            
            if presion_sistolica and (presion_sistolica < 50 or presion_sistolica > 300):
                raise ValidationError("La presión sistólica debe estar entre 50 y 300 mmHg")
            
            if presion_diastolica and (presion_diastolica < 30 or presion_diastolica > 200):
                raise ValidationError("La presión diastólica debe estar entre 30 y 200 mmHg")
            
            if presion_sistolica and presion_diastolica and presion_diastolica >= presion_sistolica:
                raise ValidationError("La presión sistólica debe ser mayor que la diastólica")
            
            medical_record = MedicalRecord.objects.create(
                patient=patient,
                fecha_registro=medical_data.get('fecha_registro', timezone.now().date()),
                **{k: v for k, v in medical_data.items() if k != 'fecha_registro'}
            )
            
            logger.info(f"Registro médico creado para paciente {patient.dni}")
            return medical_record
            
        except Exception as e:
            logger.error(f"Error creando registro médico para paciente {patient.id}: {str(e)}")
            raise
    
    def get_patient_medical_history(self, patient: Patient) -> Dict[str, Any]:
        """
        Obtiene el historial médico completo de un paciente
        
        Args:
            patient: Paciente
            
        Returns:
            Dict: Historial médico completo
        """
        try:
            medical_records = patient.medical_records.order_by('-fecha_registro')
            medical_data = patient.medical_data.order_by('-date_recorded')
            predictions = getattr(patient, 'predictions', None)
            
            history = {
                'patient_info': {
                    'nombres': patient.nombres,
                    'apellidos': patient.apellidos,
                    'dni': patient.dni,
                    'edad': patient.age,
                    'sexo': patient.sexo
                },
                'medical_records': [
                    {
                        'fecha': record.fecha_registro,
                        'peso': float(record.peso) if record.peso else None,
                        'altura': float(record.altura) if record.altura else None,
                        'imc': float(record.imc) if record.imc else None,
                        'presion_sistolica': record.presion_sistolica,
                        'presion_diastolica': record.presion_diastolica
                    }
                    for record in medical_records
                ],
                'medical_data_count': medical_data.count(),
                'predictions_count': predictions.count() if predictions else 0
            }
            
            return history
            
        except Exception as e:
            logger.error(f"Error obteniendo historial médico del paciente {patient.id}: {str(e)}")
            return {}
