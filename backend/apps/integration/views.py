from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ExternalSystemIntegration, IntegrationLog
from .services import PolyclinicoIntegrationService
from apps.patients.models import Patient
from apps.patients.serializers import PatientSerializer
from apps.predictions.models import Prediction
from ml_models.cardiovascular_predictor_clean import cardiovascular_predictor
import logging

logger = logging.getLogger('cardiovascular')

class IntegrationViewSet(viewsets.ViewSet):
    """API para integración con sistemas externos"""
    
    @action(detail=False, methods=['post'])
    def import_patient(self, request):
        """
        Importar paciente desde sistema externo
        
        Body:
        {
            "external_patient_id": "12345",
            "integration_name": "HIS_Principal" (opcional)
        }
        """
        external_patient_id = request.data.get('external_patient_id')
        integration_name = request.data.get('integration_name')
        
        if not external_patient_id:
            return Response(
                {'error': 'external_patient_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient = PolyclinicoIntegrationService.import_patient_from_external(
                external_patient_id, integration_name
            )
            
            if patient:
                serializer = PatientSerializer(patient)
                return Response({
                    'message': 'Paciente importado exitosamente',
                    'patient': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': 'No se pudo importar el paciente'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            logger.error(f"Error importando paciente: {e}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def predict_from_external(self, request):
        """
        Realizar predicción cardiovascular desde datos externos
        
        Body:
        {
            "external_patient_id": "12345",
            "integration_name": "HIS_Principal" (opcional),
            "auto_import": true (opcional)
        }
        """
        external_patient_id = request.data.get('external_patient_id')
        integration_name = request.data.get('integration_name')
        auto_import = request.data.get('auto_import', True)
        
        if not external_patient_id:
            return Response(
                {'error': 'external_patient_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar paciente existente
            patient = Patient.objects.filter(
                external_patient_id=external_patient_id
            ).first()
            
            # Importar si no existe y auto_import está habilitado
            if not patient and auto_import:
                patient = PolyclinicoIntegrationService.import_patient_from_external(
                    external_patient_id, integration_name
                )
            
            if not patient:
                return Response(
                    {'error': 'Paciente no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener último registro médico
            latest_record = patient.medical_records.first()
            if not latest_record:
                return Response(
                    {'error': 'No hay registros médicos para el paciente'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Realizar predicción
            prediction_result = cardiovascular_predictor.predict_cardiovascular_risk(latest_record)
            
            # Guardar predicción
            prediction = Prediction.objects.create(
                patient=patient,
                medical_record=latest_record,
                **prediction_result
            )
            
            return Response({
                'message': 'Predicción completada exitosamente',
                'patient_id': str(patient.id),
                'prediction_id': str(prediction.id),
                'prediction': {
                    'riesgo_nivel': prediction.riesgo_nivel,
                    'probabilidad': prediction.probabilidad,
                    'factores_riesgo': prediction.factores_riesgo,
                    'recomendaciones': prediction.recomendaciones,
                    'confidence_score': prediction.confidence_score
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error en predicción desde sistema externo: {e}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_predict(self, request):
        """
        Realizar predicciones en lote desde sistema externo
        
        Body:
        {
            "external_patient_ids": ["12345", "67890", "11111"],
            "integration_name": "HIS_Principal" (opcional)
        }
        """
        external_patient_ids = request.data.get('external_patient_ids', [])
        integration_name = request.data.get('integration_name')
        
        if not external_patient_ids:
            return Response(
                {'error': 'external_patient_ids es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        errors = []
        
        for external_id in external_patient_ids:
            try:
                # Buscar o importar paciente
                patient = Patient.objects.filter(external_patient_id=external_id).first()
                if not patient:
                    patient = PolyclinicoIntegrationService.import_patient_from_external(
                        external_id, integration_name
                    )
                
                if not patient:
                    errors.append(f"Paciente {external_id} no encontrado")
                    continue
                
                # Obtener último registro médico
                latest_record = patient.medical_records.first()
                if not latest_record:
                    errors.append(f"Paciente {external_id} sin registros médicos")
                    continue
                
                # Realizar predicción
                prediction_result = cardiovascular_predictor.predict_cardiovascular_risk(latest_record)
                
                # Guardar predicción
                prediction = Prediction.objects.create(
                    patient=patient,
                    medical_record=latest_record,
                    **prediction_result
                )
                
                results.append({
                    'external_patient_id': external_id,
                    'patient_id': str(patient.id),
                    'prediction_id': str(prediction.id),
                    'riesgo_nivel': prediction.riesgo_nivel,
                    'probabilidad': prediction.probabilidad
                })
                
            except Exception as e:
                errors.append(f"Error procesando paciente {external_id}: {str(e)}")
        
        return Response({
            'message': f'Procesados {len(results)} pacientes exitosamente',
            'results': results,
            'errors': errors,
            'total_processed': len(results),
            'total_errors': len(errors)
        })
    
    @action(detail=False, methods=['get'])
    def integration_status(self, request):
        """Obtener estado de las integraciones"""
        integrations = ExternalSystemIntegration.objects.filter(is_active=True)
        
        status_data = []
        for integration in integrations:
            recent_logs = IntegrationLog.objects.filter(
                integration=integration
            )[:10]
            
            status_data.append({
                'name': integration.name,
                'system_type': integration.system_type,
                'base_url': integration.base_url,
                'is_active': integration.is_active,
                'recent_logs': [
                    {
                        'type': log.log_type,
                        'message': log.message,
                        'success': log.success,
                        'created_at': log.created_at
                    } for log in recent_logs
                ]
            })
        
        return Response({
            'integrations': status_data,
            'total_active': len(status_data)
        })
