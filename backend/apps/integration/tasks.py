"""
Tareas asíncronas para integración con sistemas externos
"""

import logging
from celery import shared_task
from django.conf import settings
from datetime import datetime, timedelta
from apps.integration.models import ExternalSystemIntegration, IntegrationLog
from apps.integration.services import ExternalSystemService, PolyclinicoIntegrationService
from apps.patients.models import Patient

logger = logging.getLogger('cardiovascular.integration')

@shared_task(bind=True, retry_backoff=True, max_retries=3)
def sync_external_data(self):
    """
    Sincroniza datos con sistemas externos del policlínico
    """
    try:
        logger.info("Iniciando sincronización con sistemas externos")
        
        # Obtener servicios de integración activos
        active_integrations = ExternalSystemIntegration.objects.filter(is_active=True)
        
        sync_results = []
        
        for integration in active_integrations:
            try:
                service = ExternalSystemService(integration)
                
                # Sincronizar pacientes nuevos
                patients_result = service.sync_patients()
                
                # Sincronizar registros médicos actualizados
                medical_records_result = service.sync_medical_records()
                
                sync_results.append({
                    'system_name': integration.system_name,
                    'success': True,
                    'patients_synced': patients_result.get('count', 0),
                    'medical_records_synced': medical_records_result.get('count', 0)
                })
                
                # Log exitoso
                IntegrationLog.objects.create(
                    integration=integration,
                    operation='sync_external_data',
                    status='success',
                    details=f"Pacientes: {patients_result.get('count', 0)}, Registros: {medical_records_result.get('count', 0)}"
                )
                
            except Exception as e:
                logger.error(f"Error sincronizando con {integration.system_name}: {str(e)}")
                
                sync_results.append({
                    'system_name': integration.system_name,
                    'success': False,
                    'error': str(e)
                })
                
                # Log error
                IntegrationLog.objects.create(
                    integration=integration,
                    operation='sync_external_data',
                    status='error',
                    details=str(e)
                )
        
        logger.info(f"Sincronización completada: {len(sync_results)} sistemas procesados")
        
        return {
            'success': True,
            'results': sync_results,
            'processed_systems': len(sync_results)
        }
        
    except Exception as e:
        logger.error(f"Error en sincronización externa: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def sync_polyclinico_patients():
    """
    Sincronización específica con el Policlínico Laura Caller
    """
    try:
        logger.info("Iniciando sincronización con Policlínico Laura Caller")
        
        polyclinico_service = PolyclinicoIntegrationService()
        
        # Obtener pacientes nuevos/actualizados del policlínico
        patients_data = polyclinico_service.fetch_updated_patients()
        
        created_count = 0
        updated_count = 0
        error_count = 0
        
        for patient_data in patients_data:
            try:
                # Buscar paciente existente por DNI
                patient, created = Patient.objects.get_or_create(
                    dni=patient_data['dni'],
                    defaults={
                        'nombre': patient_data['nombre'],
                        'apellidos': patient_data['apellidos'],
                        'fecha_nacimiento': patient_data['fecha_nacimiento'],
                        'sexo': patient_data['sexo'],
                        'peso': patient_data.get('peso'),
                        'altura': patient_data.get('altura'),
                        'numero_historia': patient_data.get('numero_historia'),
                        'external_id': patient_data.get('id'),
                        'source_system': 'polyclinico'
                    }
                )
                
                if created:
                    created_count += 1
                    logger.debug(f"Paciente creado: {patient.dni}")
                else:
                    # Actualizar datos si es necesario
                    updated = False
                    for field, value in patient_data.items():
                        if hasattr(patient, field) and getattr(patient, field) != value:
                            setattr(patient, field, value)
                            updated = True
                    
                    if updated:
                        patient.save()
                        updated_count += 1
                        logger.debug(f"Paciente actualizado: {patient.dni}")
                
                # Sincronizar registros médicos del paciente
                polyclinico_service.sync_patient_medical_records(patient)
                
            except Exception as e:
                logger.error(f"Error procesando paciente {patient_data.get('dni', 'UNKNOWN')}: {str(e)}")
                error_count += 1
        
        logger.info(f"Sincronización Policlínico completada: {created_count} creados, {updated_count} actualizados, {error_count} errores")
        
        return {
            'success': True,
            'created_patients': created_count,
            'updated_patients': updated_count,
            'error_count': error_count,
            'total_processed': len(patients_data)
        }
        
    except Exception as e:
        logger.error(f"Error en sincronización Policlínico: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def export_predictions_to_external_system(system_name, prediction_ids):
    """
    Exporta predicciones a sistema externo
    
    Args:
        system_name: Nombre del sistema externo
        prediction_ids: Lista de IDs de predicciones a exportar
    """
    try:
        logger.info(f"Exportando {len(prediction_ids)} predicciones a {system_name}")
        
        integration = ExternalSystemIntegration.objects.get(
            system_name=system_name,
            is_active=True
        )
        
        service = ExternalSystemService(integration)
        
        # Obtener predicciones
        from apps.predictions.models import PredictionResult
        predictions = PredictionResult.objects.filter(id__in=prediction_ids)
        
        export_results = []
        
        for prediction in predictions:
            try:
                # Preparar datos para exportación
                export_data = {
                    'patient_dni': prediction.patient.dni,
                    'patient_name': f"{prediction.patient.nombre} {prediction.patient.apellidos}",
                    'risk_level': prediction.risk_level,
                    'probability': prediction.probability,
                    'confidence_score': prediction.confidence_score,
                    'prediction_date': prediction.created_at.isoformat(),
                    'model_version': prediction.model_version
                }
                
                # Exportar predicción
                result = service.export_prediction(export_data)
                
                if result.get('success'):
                    prediction.exported_to.add(integration)
                    export_results.append({
                        'prediction_id': prediction.id,
                        'success': True
                    })
                else:
                    export_results.append({
                        'prediction_id': prediction.id,
                        'success': False,
                        'error': result.get('error', 'Unknown error')
                    })
                
            except Exception as e:
                logger.error(f"Error exportando predicción {prediction.id}: {str(e)}")
                export_results.append({
                    'prediction_id': prediction.id,
                    'success': False,
                    'error': str(e)
                })
        
        success_count = sum(1 for r in export_results if r['success'])
        error_count = len(export_results) - success_count
        
        logger.info(f"Exportación completada: {success_count} éxitos, {error_count} errores")
        
        # Log resultado
        IntegrationLog.objects.create(
            integration=integration,
            operation='export_predictions',
            status='success' if error_count == 0 else 'partial',
            details=f"Exportadas {success_count}/{len(prediction_ids)} predicciones"
        )
        
        return {
            'success': True,
            'total_predictions': len(prediction_ids),
            'success_count': success_count,
            'error_count': error_count,
            'results': export_results
        }
        
    except Exception as e:
        logger.error(f"Error en exportación a {system_name}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def cleanup_integration_logs():
    """
    Limpia logs de integración antiguos
    """
    try:
        # Eliminar logs más antiguos de 30 días
        cutoff_date = datetime.now() - timedelta(days=30)
        
        old_logs = IntegrationLog.objects.filter(created_at__lt=cutoff_date)
        count = old_logs.count()
        old_logs.delete()
        
        logger.info(f"Se eliminaron {count} logs de integración antiguos")
        
        return {
            'success': True,
            'deleted_logs': count
        }
        
    except Exception as e:
        logger.error(f"Error limpiando logs de integración: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task(bind=True)
def test_external_system_connection(self, system_name):
    """
    Prueba la conexión con un sistema externo
    
    Args:
        system_name: Nombre del sistema a probar
    """
    try:
        integration = ExternalSystemIntegration.objects.get(
            system_name=system_name,
            is_active=True
        )
        
        service = ExternalSystemService(integration)
        
        # Realizar prueba de conexión
        test_result = service.test_connection()
        
        if test_result.get('success'):
            logger.info(f"Conexión exitosa con {system_name}")
            
            # Actualizar última conexión exitosa
            integration.last_successful_sync = datetime.now()
            integration.save()
            
            # Log exitoso
            IntegrationLog.objects.create(
                integration=integration,
                operation='test_connection',
                status='success',
                details='Conexión exitosa'
            )
        else:
            logger.warning(f"Fallo en conexión con {system_name}: {test_result.get('error')}")
            
            # Log error
            IntegrationLog.objects.create(
                integration=integration,
                operation='test_connection',
                status='error',
                details=test_result.get('error', 'Unknown error')
            )
        
        return test_result
        
    except Exception as e:
        logger.error(f"Error probando conexión con {system_name}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
