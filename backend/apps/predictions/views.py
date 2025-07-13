from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import datetime
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
        """
        Recibe datos completos de paciente y registro médico, busca o crea/actualiza Patient,
        crea MedicalRecord, crea MedicalData y luego genera la predicción, devolviendo el resultado.
        """
        from apps.medical_data.models import MedicalData
        from django.utils import timezone

        try:
            data = request.data

            # --- 0. Procesar y validar datos de entrada ---
            fecha_nacimiento_str = data.get('fecha_nacimiento')
            fecha_nacimiento_obj = None
            if fecha_nacimiento_str:
                try:
                    fecha_nacimiento_obj = datetime.datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'El formato de fecha_nacimiento es inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

            # --- 1. Buscar o crear/actualizar paciente ---
            dni = data.get('dni')
            numero_historia = data.get('numero_historia')
            # Validar identificador mínimo
            if not dni and not numero_historia:
                return Response({'error': 'Se requiere al menos el DNI o el número de historia para identificar al paciente.'}, status=status.HTTP_400_BAD_REQUEST)
            # Buscar paciente existente y validar duplicados
            if dni:
                pacientes = Patient.objects.filter(dni=dni)
            else:
                pacientes = Patient.objects.filter(numero_historia=numero_historia)
            if pacientes.count() > 1:
                return Response({'error': 'Hay más de un paciente con el mismo identificador. Corrija los duplicados antes de continuar.'}, status=status.HTTP_400_BAD_REQUEST)
            if pacientes.count() == 1:
                patient = pacientes.first()
                patient_fields_to_update = {
                    'nombre': data.get('nombre'),
                    'apellidos': data.get('apellidos'),
                    'sexo': data.get('sexo'),
                    'peso': data.get('peso'),
                    'altura': data.get('altura'),
                    'telefono': data.get('telefono'),
                    'email': data.get('email'),
                    'direccion': data.get('direccion'),
                    'numero_historia': data.get('numero_historia'),
                    'hospital': data.get('hospital'),
                    'fecha_nacimiento': fecha_nacimiento_obj
                }
                updated = False
                for field, value in patient_fields_to_update.items():
                    if value not in [None, '', []] and getattr(patient, field) != value:
                        setattr(patient, field, value)
                        updated = True
                if updated:
                    patient.save()
            else:
                # Validar campos obligatorios para crear paciente
                required_fields = ['dni', 'nombre', 'apellidos', 'fecha_nacimiento', 'sexo']
                for field in required_fields:
                    if not data.get(field):
                        return Response({'error': f'El campo obligatorio "{field}" falta o está vacío.'}, status=status.HTTP_400_BAD_REQUEST)
                create_fields = {
                    'fecha_nacimiento': fecha_nacimiento_obj
                }
                for field in ['dni','nombre','apellidos','sexo','peso','altura','telefono','email','direccion','numero_historia','hospital']:
                    if data.get(field) not in [None, '', []]:
                        create_fields[field] = data.get(field)
                if 'dni' not in create_fields:
                    create_fields['dni'] = None
                if 'numero_historia' not in create_fields:
                    create_fields['numero_historia'] = f"AUTO_{int(timezone.now().timestamp())}"
                patient = Patient.objects.create(**create_fields)

            # --- 2. Crear el registro médico ---
            # Calcular la edad del paciente
            today = datetime.date.today()
            if not fecha_nacimiento_obj:
                if patient and patient.fecha_nacimiento:
                    fecha_nacimiento_obj = patient.fecha_nacimiento
                else:
                    return Response({'error': 'No se puede calcular la edad sin una fecha de nacimiento.'}, status=status.HTTP_400_BAD_REQUEST)

            edad = today.year - fecha_nacimiento_obj.year - ((today.month, today.day) < (fecha_nacimiento_obj.month, fecha_nacimiento_obj.day))

            medical_record = MedicalRecord.objects.create(
                patient=patient,
                edad=edad,
                presion_sistolica=data.get('presion_sistolica', 120),
                presion_diastolica=data.get('presion_diastolica', 80),
                frecuencia_cardiaca=data.get('frecuencia_cardiaca', 70),
                colesterol=data.get('colesterol'),
                colesterol_hdl=data.get('colesterol_hdl'),
                colesterol_ldl=data.get('colesterol_ldl'),
                trigliceridos=data.get('trigliceridos'),
                glucosa=data.get('glucosa'),
                hemoglobina_glicosilada=data.get('hemoglobina_glicosilada'),
                cigarrillos_dia=data.get('cigarrillos_dia', 0),
                anos_tabaquismo=data.get('anos_tabaquismo', 0),
                actividad_fisica=data.get('actividad_fisica', 'sedentario'),
                antecedentes_cardiacos=data.get('antecedentes_cardiacos', 'no'),
                diabetes=data.get('diabetes', False),
                hipertension=data.get('hipertension', False),
                medicamentos_actuales=data.get('medicamentos_actuales', []),
                alergias=data.get('alergias', []),
                observaciones=data.get('observaciones', ''),
                fecha_registro=data.get('fecha_registro', timezone.now()),
                external_record_id=data.get('external_record_id'),
                external_data=data.get('external_data', {})
            )

            # --- 3. Crear registro en MedicalData ---
            age = 0
            if fecha_nacimiento_obj:
                today = datetime.date.today()
                age = today.year - fecha_nacimiento_obj.year - ((today.month, today.day) < (fecha_nacimiento_obj.month, fecha_nacimiento_obj.day))

            MedicalData.objects.create(
                patient=patient,
                age=age,
                gender=patient.sexo,
                smoking=data.get('cigarrillos_dia', 0) > 0,
                alcohol_consumption=data.get('alcohol_consumption', False),
                physical_activity=data.get('actividad_fisica', 'sedentario') != 'sedentario',
                systolic_pressure=data.get('presion_sistolica', 120),
                diastolic_pressure=data.get('presion_diastolica', 80),
                heart_rate=data.get('frecuencia_cardiaca', 70),
                cholesterol=data.get('colesterol'),
                glucose=data.get('glucosa'),
                family_history=data.get('antecedentes_cardiacos', 'no') == 'si',
                previous_conditions=data.get('observaciones', ''),
                prediction_date=timezone.now()
            )

            # --- 4. Generar predicción ---
            prediction_obj = self.prediction_service.get_prediction(patient, medical_record)

            # --- 5. Actualizar MedicalData con los resultados ---
            medical_data_record = MedicalData.objects.filter(patient=patient).latest('date_recorded')
            # Convertir de porcentaje (0-100) a decimal (0-1) para almacenar en risk_score
            medical_data_record.risk_score = prediction_obj.probabilidad / 100.0
            medical_data_record.prediction_date = prediction_obj.created_at
            medical_data_record.save()

            # --- 6. Devolver la respuesta serializada ---
            serializer = self.get_serializer(prediction_obj)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            return Response(
                {'error': f'Error al realizar la predicción: {str(e)}'},
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
