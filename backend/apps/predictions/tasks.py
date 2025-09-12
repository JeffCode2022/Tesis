"""
Tareas asíncronas para el sistema de predicciones cardiovasculares
"""

import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from datetime import datetime, timedelta
from apps.patients.models import Patient, MedicalRecord
from apps.predictions.models import PredictionResult
from apps.predictions.services import PredictionService
from apps.predictions.validators import MedicalDataValidator

logger = logging.getLogger('cardiovascular.tasks')

@shared_task(bind=True, retry_backoff=True, max_retries=3)
def predict_cardiovascular_risk_async(self, patient_id, medical_data):
    """
    Tarea asíncrona para realizar predicción de riesgo cardiovascular
    
    Args:
        patient_id: ID del paciente
        medical_data: Datos médicos para la predicción
        
    Returns:
        dict: Resultado de la predicción
    """
    try:
        logger.info(f"Iniciando predicción asíncrona para paciente {patient_id}")
        
        # Obtener paciente
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            logger.error(f"Paciente {patient_id} no encontrado")
            raise Exception(f"Paciente {patient_id} no encontrado")
        
        # Validar datos médicos
        validator = MedicalDataValidator()
        validation_result = validator.validate(medical_data)
        
        if not validation_result.is_valid:
            logger.warning(f"Datos médicos inválidos para paciente {patient_id}: {validation_result.errors}")
            return {
                'success': False,
                'error': 'Datos médicos inválidos',
                'validation_errors': validation_result.errors
            }
        
        # Realizar predicción
        prediction_service = PredictionService()
        prediction_result = prediction_service.predict(patient, medical_data)
        
        # Guardar resultado
        prediction_record = PredictionResult.objects.create(
            patient=patient,
            risk_level=prediction_result['risk_level'],
            probability=prediction_result['probability'],
            confidence_score=prediction_result['confidence_score'],
            features_used=prediction_result.get('features_used', {}),
            model_version=prediction_result.get('model_version', '1.0'),
            created_by_id=medical_data.get('created_by_id'),
            is_async=True
        )
        
        logger.info(f"Predicción completada para paciente {patient_id}: {prediction_result['risk_level']}")
        
        # Enviar notificación por email si es alto riesgo
        if prediction_result['risk_level'] == 'Alto':
            send_high_risk_notification.delay(patient_id, prediction_record.id)
        
        return {
            'success': True,
            'prediction_id': prediction_record.id,
            'risk_level': prediction_result['risk_level'],
            'probability': prediction_result['probability'],
            'confidence_score': prediction_result['confidence_score']
        }
        
    except Exception as e:
        logger.error(f"Error en predicción asíncrona para paciente {patient_id}: {str(e)}")
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Reintentando predicción para paciente {patient_id} (intento {self.request.retries + 1})")
            raise self.retry(countdown=60 * (2 ** self.request.retries))  # Exponential backoff
        
        return {
            'success': False,
            'error': str(e),
            'patient_id': patient_id
        }

@shared_task
def send_high_risk_notification(patient_id, prediction_id):
    """
    Envía notificación por email cuando se detecta alto riesgo cardiovascular
    
    Args:
        patient_id: ID del paciente
        prediction_id: ID de la predicción
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        prediction = PredictionResult.objects.get(id=prediction_id)
        
        subject = f'ALERTA: Alto Riesgo Cardiovascular - {patient.nombre} {patient.apellidos}'
        message = f"""
        Se ha detectado ALTO RIESGO cardiovascular en el paciente:
        
        Paciente: {patient.nombre} {patient.apellidos}
        DNI: {patient.dni}
        Probabilidad: {prediction.probability:.2%}
        Confianza: {prediction.confidence_score:.2%}
        Fecha: {prediction.created_at.strftime('%d/%m/%Y %H:%M')}
        
        Por favor, revise inmediatamente el caso en el sistema.
        """
        
        # Lista de emails a notificar (configurar en settings)
        recipient_list = getattr(settings, 'HIGH_RISK_NOTIFICATION_EMAILS', [])
        
        if recipient_list:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False,
            )
            logger.info(f"Notificación de alto riesgo enviada para paciente {patient_id}")
        else:
            logger.warning("No hay emails configurados para notificaciones de alto riesgo")
            
    except Exception as e:
        logger.error(f"Error enviando notificación de alto riesgo: {str(e)}")

@shared_task
def cleanup_old_predictions():
    """
    Limpia predicciones antiguas del sistema (tarea periódica)
    """
    try:
        # Eliminar predicciones más antiguas de 90 días
        cutoff_date = datetime.now() - timedelta(days=90)
        
        old_predictions = PredictionResult.objects.filter(
            created_at__lt=cutoff_date,
            is_archived=False
        )
        
        count = old_predictions.count()
        
        # Marcar como archivadas en lugar de eliminar
        old_predictions.update(is_archived=True)
        
        logger.info(f"Se archivaron {count} predicciones antiguas")
        
        return {
            'success': True,
            'archived_count': count,
            'cutoff_date': cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error limpiando predicciones antiguas: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def batch_predictions(patient_ids, medical_data_list):
    """
    Procesa múltiples predicciones en lote
    
    Args:
        patient_ids: Lista de IDs de pacientes
        medical_data_list: Lista de datos médicos correspondientes
        
    Returns:
        dict: Resumen de resultados
    """
    try:
        logger.info(f"Iniciando procesamiento en lote de {len(patient_ids)} predicciones")
        
        results = []
        success_count = 0
        error_count = 0
        
        for i, patient_id in enumerate(patient_ids):
            try:
                medical_data = medical_data_list[i]
                
                # Ejecutar predicción individual de forma síncrona dentro del lote
                result = predict_cardiovascular_risk_async.apply(
                    args=[patient_id, medical_data],
                    throw=True
                ).get()
                
                results.append({
                    'patient_id': patient_id,
                    'result': result
                })
                
                if result.get('success'):
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                logger.error(f"Error en predicción lote para paciente {patient_id}: {str(e)}")
                results.append({
                    'patient_id': patient_id,
                    'result': {
                        'success': False,
                        'error': str(e)
                    }
                })
                error_count += 1
        
        logger.info(f"Procesamiento en lote completado: {success_count} éxitos, {error_count} errores")
        
        return {
            'success': True,
            'total_processed': len(patient_ids),
            'success_count': success_count,
            'error_count': error_count,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error en procesamiento en lote: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def generate_prediction_report(report_type='daily', date_range=None):
    """
    Genera reportes de predicciones (tarea periódica)
    
    Args:
        report_type: Tipo de reporte ('daily', 'weekly', 'monthly')
        date_range: Rango de fechas personalizado
        
    Returns:
        dict: Resultado del reporte
    """
    try:
        logger.info(f"Generando reporte de predicciones: {report_type}")
        
        # Determinar rango de fechas
        if date_range:
            start_date = datetime.fromisoformat(date_range['start'])
            end_date = datetime.fromisoformat(date_range['end'])
        else:
            end_date = datetime.now()
            if report_type == 'daily':
                start_date = end_date - timedelta(days=1)
            elif report_type == 'weekly':
                start_date = end_date - timedelta(weeks=1)
            elif report_type == 'monthly':
                start_date = end_date - timedelta(days=30)
            else:
                start_date = end_date - timedelta(days=1)
        
        # Obtener estadísticas
        predictions = PredictionResult.objects.filter(
            created_at__range=[start_date, end_date]
        )
        
        total_predictions = predictions.count()
        high_risk_count = predictions.filter(risk_level='Alto').count()
        medium_risk_count = predictions.filter(risk_level='Medio').count()
        low_risk_count = predictions.filter(risk_level='Bajo').count()
        
        avg_confidence = predictions.aggregate(
            avg_confidence=models.Avg('confidence_score')
        )['avg_confidence'] or 0
        
        report_data = {
            'report_type': report_type,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_predictions': total_predictions,
            'risk_distribution': {
                'high': high_risk_count,
                'medium': medium_risk_count,
                'low': low_risk_count
            },
            'average_confidence': round(avg_confidence, 4),
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info(f"Reporte generado: {total_predictions} predicciones procesadas")
        
        # Aquí podrías guardar el reporte en la base de datos o enviarlo por email
        
        return {
            'success': True,
            'report_data': report_data
        }
        
    except Exception as e:
        logger.error(f"Error generando reporte de predicciones: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
