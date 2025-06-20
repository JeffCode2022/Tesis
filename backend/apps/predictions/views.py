from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg
from .models import Prediction, ModelPerformance
from .serializers import PredictionSerializer, ModelPerformanceSerializer
from .services import PredictionService
from apps.patients.models import Patient, MedicalRecord
import logging

logger = logging.getLogger(__name__)

class PredictionViewSet(viewsets.ModelViewSet):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticated]
    prediction_service = PredictionService()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['riesgo_nivel', 'patient', 'model_version']
    ordering = ['-created_at']

    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            if not self.request.user.is_staff:
                queryset = queryset.filter(patient__medico_tratante=self.request.user)
            return queryset
        except Exception as e:
            logger.error(f"Error obteniendo queryset: {str(e)}")
            return Prediction.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en listado de predicciones: {str(e)}")
            return Response(
                {'error': 'Error al obtener la lista de predicciones'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def predict(self, request):
        """Realiza una predicción en tiempo real"""
        try:
            patient_id = request.data.get('patient_id')
            medical_record_id = request.data.get('medical_record_id')

            if not patient_id or not medical_record_id:
                return Response(
                    {'error': 'Se requieren patient_id y medical_record_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Paciente no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                medical_record = MedicalRecord.objects.get(id=medical_record_id)
            except MedicalRecord.DoesNotExist:
                return Response(
                    {'error': 'Registro médico no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Validar que el registro médico pertenece al paciente
            if medical_record.patient_id != patient.id:
                return Response(
                    {'error': 'El registro médico no pertenece al paciente especificado'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar que el paciente tiene todos los datos necesarios
            if not all([patient.edad, patient.peso, patient.altura]):
                return Response(
                    {'error': 'El paciente no tiene todos los datos necesarios (edad, peso, altura)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar que el registro médico tiene los datos necesarios
            required_fields = ['presion_sistolica', 'presion_diastolica']
            missing_fields = [field for field in required_fields if not getattr(medical_record, field)]
            if missing_fields:
                return Response(
                    {'error': f'Faltan datos requeridos en el registro médico: {", ".join(missing_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                prediction = self.prediction_service.get_prediction(patient, medical_record)
                serializer = self.get_serializer(prediction)
                return Response(serializer.data)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            return Response(
                {'error': 'Error al realizar la predicción'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def batch_predict(self, request):
        """Realiza predicciones en lote"""
        try:
            data_list = request.data.get('data', [])
            if not data_list:
                return Response(
                    {'error': 'Se requiere una lista de datos'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            results = self.prediction_service.batch_predict(data_list)
            serializer = self.get_serializer(results, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error en predicción en lote: {str(e)}")
            return Response(
                {'error': 'Error al realizar las predicciones en lote'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def performance_metrics(self, request):
        """Obtiene métricas de rendimiento del modelo"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No autorizado'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            metrics = ModelPerformance.objects.latest('created_at')
            serializer = ModelPerformanceSerializer(metrics)
            return Response(serializer.data)

        except ModelPerformance.DoesNotExist:
            return Response(
                {'error': 'No hay métricas disponibles'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error obteniendo métricas: {str(e)}")
            return Response(
                {'error': 'Error al obtener métricas'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Limpia el caché de predicciones"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No autorizado'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            cache.clear()
            return Response({'message': 'Caché limpiado exitosamente'})
        except Exception as e:
            logger.error(f"Error limpiando caché: {str(e)}")
            return Response(
                {'error': 'Error al limpiar el caché'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Estadísticas de predicciones"""
        try:
            total_predictions = self.get_queryset().count()
            
            risk_distribution = self.get_queryset().values('riesgo_nivel').annotate(
                count=Count('id')
            ).order_by('riesgo_nivel')
            
            avg_probability = self.get_queryset().aggregate(
                avg_prob=Avg('probabilidad')
            )['avg_prob'] or 0
            
            model_performance = ModelPerformance.objects.first()
            
            return Response({
                'total_predictions': total_predictions,
                'risk_distribution': list(risk_distribution),
                'average_probability': round(avg_probability, 2),
                'model_performance': ModelPerformanceSerializer(model_performance).data if model_performance else None
            })
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {str(e)}")
            return Response(
                {'error': 'Error al obtener estadísticas'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ModelPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelPerformance.objects.all()
    serializer_class = ModelPerformanceSerializer
    ordering = ['-created_at']
