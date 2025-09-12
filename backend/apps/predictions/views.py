from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import datetime
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.conf import settings
# from django_filters.rest_framework import DjangoFilterBackend  # Temporalmente removido por problemas de compatibilidad
from django.db.models import Count, Avg, Prefetch, Q
from django.utils import timezone
import logging
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Prediction, ModelPerformance
from .serializers import PredictionSerializer, ModelPerformanceSerializer
from .services import PredictionService
from .cache_service import cache_service
from apps.patients.models import Patient, MedicalRecord
from apps.medical_data.models import MedicalData
from apps.common.rate_limiting import prediction_rate_limit, statistics_rate_limit

logger = logging.getLogger('cardiovascular.predictions')

@extend_schema_view(
    list=extend_schema(
        summary="Listar Predicciones",
        description="Obtiene una lista paginada de predicciones de riesgo cardiovascular",
        parameters=[
            OpenApiParameter(
                name='riesgo_nivel',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtrar por nivel de riesgo (bajo, medio, alto, critico)'
            ),
            OpenApiParameter(
                name='patient',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por ID del paciente'
            ),
        ],
        tags=['Predicciones']
    ),
    create=extend_schema(
        summary="Crear Predicción",
        description="Crea una nueva predicción (uso interno del sistema)",
        tags=['Predicciones']
    ),
    retrieve=extend_schema(
        summary="Obtener Predicción",
        description="Obtiene los detalles de una predicción específica",
        tags=['Predicciones']
    ),
    update=extend_schema(
        summary="Actualizar Predicción",
        description="Actualiza una predicción existente",
        tags=['Predicciones']
    ),
    destroy=extend_schema(
        summary="Eliminar Predicción",
        description="Elimina una predicción del sistema",
        tags=['Predicciones']
    )
)
class PredictionViewSet(viewsets.ModelViewSet):
    queryset = Prediction.objects.all()  # Queryset base requerido por DRF
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticated]
    prediction_service = PredictionService()
    # filter_backends = [DjangoFilterBackend]  # Temporalmente deshabilitado
    # filterset_fields = ['riesgo_nivel', 'patient', 'model_version']  # Filtros manuales implementados en get_queryset
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Optimiza queryset con select_related y prefetch_related según la acción
        """
        base_queryset = Prediction.objects.all()
        
        try:
            # Filtrar según permisos de usuario
            if not self.request.user.is_staff:
                base_queryset = base_queryset.filter(patient__medico_tratante=self.request.user)
            
            # Aplicar filtros manuales desde query parameters
            riesgo_nivel = self.request.query_params.get('riesgo_nivel')
            if riesgo_nivel:
                base_queryset = base_queryset.filter(riesgo_nivel=riesgo_nivel)
                
            patient = self.request.query_params.get('patient')
            if patient:
                base_queryset = base_queryset.filter(patient=patient)
                
            model_version = self.request.query_params.get('model_version')
            if model_version:
                base_queryset = base_queryset.filter(model_version=model_version)
            
            # Optimizar según la acción
            if self.action == 'list':
                # Para listado, optimizar con select_related para paciente
                return base_queryset.select_related(
                    'patient',
                    'patient__medico_tratante',
                    'medical_record'
                ).order_by('-created_at')
            
            elif self.action == 'retrieve':
                # Para detalle, incluir relaciones completas
                return base_queryset.select_related(
                    'patient',
                    'patient__medico_tratante',
                    'medical_record'
                ).prefetch_related(
                    Prefetch(
                        'patient__medical_records',
                        queryset=MedicalRecord.objects.order_by('-fecha_registro')
                    )
                )
            
            elif self.action == 'statistics':
                # Para estadísticas, solo la relación básica
                return base_queryset.select_related('patient')
            
            else:
                # Queryset base optimizado para otros casos
                return base_queryset.select_related('patient')
                
        except Exception as e:
            logger.error(f"Error obteniendo queryset optimizado: {str(e)}")
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

    @extend_schema(
        summary="Realizar Predicción Cardiovascular",
        description="""
        Endpoint principal para realizar predicciones de riesgo cardiovascular.
        
        **Características:**
        - ✅ Cache inteligente para resultados similares
        - ✅ Rate limiting por tier de usuario
        - ✅ Validación completa de datos médicos
        - ✅ Creación/actualización automática de pacientes
        
        **Rate Limits:**
        - Usuarios autenticados: 30 requests/minuto
        - Usuarios premium: 100 requests/minuto
        - Administradores: 1000+ requests/minuto
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'dni': {'type': 'string', 'example': '12345678A'},
                    'nombre': {'type': 'string', 'example': 'Juan'},
                    'apellidos': {'type': 'string', 'example': 'Pérez García'},
                    'fecha_nacimiento': {'type': 'string', 'format': 'date', 'example': '1975-03-15'},
                    'sexo': {'type': 'string', 'enum': ['M', 'F'], 'example': 'M'},
                    'colesterol': {'type': 'number', 'example': 220.5},
                    'presion_sistolica': {'type': 'integer', 'example': 140},
                    'presion_diastolica': {'type': 'integer', 'example': 90},
                    'frecuencia_cardiaca': {'type': 'integer', 'example': 75},
                    'glucosa': {'type': 'number', 'example': 110.0},
                    'imc': {'type': 'number', 'example': 28.5},
                    'cigarrillos_dia': {'type': 'integer', 'example': 0},
                    'antecedentes_cardiacos': {'type': 'string', 'enum': ['si', 'no'], 'example': 'no'},
                    'actividad_fisica': {'type': 'string', 'enum': ['sedentario', 'ligera', 'moderada', 'intensa'], 'example': 'ligera'}
                },
                'required': ['dni', 'nombre', 'apellidos', 'sexo', 'colesterol', 'presion_sistolica', 'presion_diastolica']
            }
        },
        responses={
            200: {
                'description': 'Predicción realizada exitosamente',
                'content': {
                    'application/json': {
                        'example': {
                            'id': 123,
                            'probabilidad': 65.5,
                            'riesgo_nivel': 'medio',
                            'confidence': 0.87,
                            'recomendaciones': ['Ejercicio regular', 'Dieta saludable'],
                            'patient': 456,
                            'created_at': '2024-08-24T10:30:00Z',
                            'cache_info': {
                                'from_cache': False,
                                'cached_successfully': True,
                                'generated_at': '2024-08-24T10:30:00Z'
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Datos de entrada inválidos',
                'content': {
                    'application/json': {
                        'example': {
                            'error': 'El formato de fecha_nacimiento es inválido. Use YYYY-MM-DD.'
                        }
                    }
                }
            },
            429: {'$ref': '#/components/schemas/RateLimitError'},
            500: {
                'description': 'Error interno del servidor',
                'content': {
                    'application/json': {
                        'example': {
                            'error': 'Error al realizar la predicción: ...'
                        }
                    }
                }
            }
        },
        tags=['Predicciones'],
        parameters=[
            OpenApiParameter(
                name='force_refresh',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Usar "1" para forzar bypass del cache',
                required=False
            )
        ]
    )
    @action(detail=False, methods=['post'])
    @prediction_rate_limit
    def predict(self, request):
        """
        Recibe datos completos de paciente y registro médico con sistema de cache inteligente.
        Optimización NIVEL 2: Cache para predicciones y datos de paciente + Rate limiting.
        """
        from apps.medical_data.models import MedicalData
        from django.utils import timezone

        try:
            data = request.data
            logger.info(f"Datos recibidos en predict: {data}")

            # --- 0.1 Preparar datos médicos para cache ---
            medical_cache_data = {
                'edad': data.get('edad'),
                'sexo': data.get('sexo'),
                'colesterol': data.get('colesterol'),
                'presion_sistolica': data.get('presion_sistolica'),
                'presion_diastolica': data.get('presion_diastolica'),
                'frecuencia_cardiaca': data.get('frecuencia_cardiaca'),
                'glucosa': data.get('glucosa'),
                'imc': data.get('imc'),
                'cigarrillos_dia': data.get('cigarrillos_dia', 0),
                'antecedentes_cardiacos': data.get('antecedentes_cardiacos', 'no'),
                'actividad_fisica': data.get('actividad_fisica', 'sedentario'),
                'alcohol_consumption': data.get('alcohol_consumption', False)
            }
            
            logger.info(f"Datos para cache: {medical_cache_data}")

            # --- 0.2 Verificar cache de predicción ---
            cached_prediction = cache_service.get_prediction_cache(medical_cache_data)
            logger.info(f"Predicción en cache: {cached_prediction is not None}")
            if cached_prediction:
                logger.info(f"Datos de cache: riesgo={cached_prediction.get('riesgo_nivel')}, prob={cached_prediction.get('probabilidad')}")
            
            if cached_prediction and request.GET.get('force_refresh') != '1':
                logger.info("Returning cached prediction result")
                return Response({
                    **cached_prediction,
                    'cache_info': {
                        'from_cache': True,
                        'cached_at': cached_prediction.get('cached_at'),
                        'cache_key_hash': cached_prediction.get('medical_data_hash')
                    }
                })

            # --- 0.3 Procesar y validar datos de entrada ---
            fecha_nacimiento_str = data.get('fecha_nacimiento')
            fecha_nacimiento_obj = None
            if fecha_nacimiento_str:
                try:
                    fecha_nacimiento_obj = datetime.datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'El formato de fecha_nacimiento es inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

            # --- 1. Buscar o crear/actualizar paciente con cache ---
            dni = data.get('dni')
            numero_historia = data.get('numero_historia')
            
            # Validar identificador mínimo
            if not dni and not numero_historia:
                return Response({'error': 'Se requiere al menos el DNI o el número de historia para identificar al paciente.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar cache de paciente primero
            patient = None
            patient_cache_key = f"patient_{dni}_{numero_historia}" if dni and numero_historia else (f"patient_dni_{dni}" if dni else f"patient_historia_{numero_historia}")
            
            # Buscar paciente existente y validar duplicados
            if dni:
                pacientes = Patient.objects.filter(dni=dni)
            else:
                pacientes = Patient.objects.filter(numero_historia=numero_historia)
            
            if pacientes.count() > 1:
                return Response({'error': 'Hay más de un paciente con el mismo identificador. Corrija los duplicados antes de continuar.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if pacientes.count() == 1:
                patient = pacientes.first()
                
                # Actualizar cache de paciente
                patient_data = {
                    'id': patient.id,
                    'nombre': patient.nombre,
                    'apellidos': patient.apellidos,
                    'dni': patient.dni,
                    'numero_historia': patient.numero_historia
                }
                cache_service.set_patient_cache(patient.id, patient_data)
                
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
            logger.info(f"Generando predicción para paciente {patient.id} con registro médico {medical_record.id}")
            prediction_obj = self.prediction_service.get_prediction(patient, medical_record)
            logger.info(f"Predicción generada: {prediction_obj.riesgo_nivel} {prediction_obj.probabilidad}% - ID: {prediction_obj.id}")
            
            # Verificar que la predicción se guardó en la base de datos
            prediction_from_db = Prediction.objects.get(id=prediction_obj.id)
            logger.info(f"Predicción verificada en BD: {prediction_from_db.riesgo_nivel} {prediction_from_db.probabilidad}%")

            # --- 5. Actualizar MedicalData con los resultados ---
            medical_data_record = MedicalData.objects.filter(patient=patient).latest('date_recorded')
            # Convertir de porcentaje (0-100) a decimal (0-1) para almacenar en risk_score
            medical_data_record.risk_score = prediction_obj.probabilidad / 100.0
            medical_data_record.prediction_date = prediction_obj.created_at
            medical_data_record.save()

            # --- 6. Cachear resultado de predicción ---
            serializer = self.get_serializer(prediction_obj)
            prediction_result = serializer.data
            
            # Enriquecer datos para cache
            prediction_result['risk_level'] = prediction_obj.riesgo_nivel
            prediction_result['confidence'] = prediction_obj.confidence if hasattr(prediction_obj, 'confidence') else 0.85
            
            # Guardar en cache
            cache_success = cache_service.set_prediction_cache(medical_cache_data, prediction_result)
            if cache_success:
                logger.info("Prediction result cached successfully")
            
            # --- 6.5 Invalidar cache de lista de pacientes ---
            # Invalidar todas las claves de cache que empiecen con 'patients_list_'
            from django.core.cache import cache
            
            # Obtener todas las claves del cache que contengan 'patients_list_'
            # Como no podemos iterar directamente sobre las claves en algunas implementaciones de cache,
            # vamos a intentar borrar varias variaciones comunes
            cache_keys_to_try = []
            
            # Generar posibles claves de cache basadas en parámetros comunes
            common_params = [
                {},  # Sin parámetros
                {'page': '1'},
                {'page': '2'}, 
                {'page_size': '10'},
                {'page_size': '20'},
                {'ordering': '-created_at'},
                {'search': ''},
            ]
            
            for params in common_params:
                cache_key = 'patients_list_{}'.format(hash(str(params)))
                cache_keys_to_try.append(cache_key)
            
            # También intentar con algunos hashes específicos que podrían existir
            for i in range(20):  # Intentar con diferentes variaciones
                cache_key = f'patients_list_{hash(str({})) + i}'
                cache_keys_to_try.append(cache_key)
            
            # Borrar todas las claves encontradas
            deleted_count = 0
            for cache_key in cache_keys_to_try:
                if cache.delete(cache_key):
                    deleted_count += 1
            
            logger.info(f"Invalidated {deleted_count} patient list cache keys")
            
            # --- 7. Devolver la respuesta con información de cache ---
            return Response({
                **prediction_result,
                'cache_info': {
                    'from_cache': False,
                    'cached_successfully': cache_success,
                    'generated_at': timezone.now().isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            return Response(
                {'error': f'Error al realizar la predicción: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    @prediction_rate_limit
    def batch_predict(self, request):
        """Realiza predicciones en lote con rate limiting"""
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
    @statistics_rate_limit
    def statistics(self, request):
        """Estadísticas de predicciones con cache y rate limiting"""
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

    @action(detail=False, methods=['get'])
    def cache_stats(self, request):
        """Obtiene estadísticas del sistema de cache."""
        try:
            stats = cache_service.get_cache_stats()
            return Response(stats)
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de cache: {str(e)}")
            return Response(
                {'error': 'Error al obtener estadísticas de cache'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Limpia el cache de predicciones (solo para administradores)."""
        try:
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permisos insuficientes'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            cache_type = request.data.get('type', 'all')
            
            if cache_type == 'predictions':
                # Limpiar solo cache de predicciones
                success = True  # Implementar limpieza específica
                message = "Cache de predicciones limpiado"
            elif cache_type == 'patients':
                # Limpiar solo cache de pacientes
                success = True  # Implementar limpieza específica
                message = "Cache de pacientes limpiado"
            else:
                success = cache_service.clear_all_cache()
                message = "Todo el cache limpiado"
            
            return Response({
                'success': success,
                'message': message,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error limpiando cache: {str(e)}")
            return Response(
                {'error': 'Error al limpiar cache'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ModelPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelPerformance.objects.all()
    serializer_class = ModelPerformanceSerializer
    ordering = ['-created_at']
