from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
# from django_filters.rest_framework import DjangoFilterBackend  # Temporalmente removido por problemas de compatibilidad
from django.db.models import Subquery, OuterRef, Count, Prefetch, Q
from django.db import models
from django.core.cache import cache
from django.utils import timezone
import logging
from .models import Patient, MedicalRecord
from apps.predictions.models import Prediction
from .serializers import (
    PatientSerializer, PatientCreateSerializer, PatientListSerializer,
    MedicalRecordSerializer, PatientDNISearchSerializer, PatientForPredictionSerializer
)
from apps.predictions.cache_service import cache_service

logger = logging.getLogger('cardiovascular.patients')

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.filter(is_active=True)  # Queryset base requerido por DRF
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['sexo', 'hospital', 'medico_tratante']  # Temporalmente deshabilitado
    search_fields = ['nombre', 'apellidos', 'numero_historia', 'email', 'dni']
    ordering_fields = ['created_at', 'nombre']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Optimiza queryset con select_related y prefetch_related según la acción
        """
        base_queryset = Patient.objects.filter(is_active=True)
        
        # Aplicar filtros manuales desde query parameters
        sexo = self.request.query_params.get('sexo')
        if sexo:
            base_queryset = base_queryset.filter(sexo=sexo)
            
        hospital = self.request.query_params.get('hospital')  
        if hospital:
            base_queryset = base_queryset.filter(hospital=hospital)
            
        medico_tratante = self.request.query_params.get('medico_tratante')
        if medico_tratante:
            base_queryset = base_queryset.filter(medico_tratante=medico_tratante)
        
        if self.action == 'list':
            # Para listado, optimizar con select_related para medico_tratante y prefetch de predicciones
            return base_queryset.select_related('medico_tratante').prefetch_related(
                Prefetch(
                    'predictions',
                    queryset=Prediction.objects.order_by('-created_at')
                )
            ).order_by('-created_at')
        
        elif self.action == 'retrieve' or self.action == 'medical_history':
            # Para detalle, incluir registros médicos
            return base_queryset.select_related('medico_tratante').prefetch_related(
                Prefetch(
                    'medical_records',
                    queryset=MedicalRecord.objects.order_by('-fecha_registro')
                )
            )
        
        return base_queryset.select_related('medico_tratante')

    def get_serializer_class(self):
        """
        Retorna serializador optimizado según la acción
        """
        if self.action == 'list':
            return PatientListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PatientCreateSerializer
        return PatientSerializer

    def list(self, request, *args, **kwargs):
        """
        Lista paginada de pacientes con cache optimizado
        """
        # Verificar si se solicita forzar refresh del cache
        force_refresh = request.GET.get('refresh') == '1'
        
        if not force_refresh:
            cache_key = 'patients_list_{}'.format(hash(str(request.query_params)))
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        
        if response.status_code == 200 and not force_refresh:
            cache_key = 'patients_list_{}'.format(hash(str(request.query_params)))
            cache.set(cache_key, response.data, timeout=300)  # Cache por 5 minutos
        
        return response

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo paciente con validación mejorada
        """
        logger.info(f"Creando nuevo paciente: {request.data.get('dni', 'DNI no proporcionado')}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Validaciones adicionales
            dni = serializer.validated_data.get('dni')
            if Patient.objects.filter(dni=dni, is_active=True).exists():
                return Response({
                    'error': 'Ya existe un paciente activo con este DNI'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            patient = serializer.save()
            
            # Invalidar cache - corregir para Redis
            try:
                # Para Redis, intentar limpiar claves específicas
                cache.delete_pattern('patients_list*')
            except AttributeError:
                # Si no es Redis, usar método alternativo
                cache.clear()
            
            logger.info(f"Paciente creado exitosamente: ID {patient.id}")
            return Response(
                PatientSerializer(patient).data, 
                status=status.HTTP_201_CREATED
            )
        
        logger.warning(f"Error en creación de paciente: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """
        Actualiza paciente con invalidación de cache
        """
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Invalidar cache - corregir para Redis
            try:
                # Para Redis, intentar limpiar claves específicas
                cache.delete_pattern('patients_list*')
            except AttributeError:
                # Si no es Redis, usar método alternativo
                cache.clear()
            logger.info(f"Paciente actualizado: ID {kwargs.get('pk')}")
        
        return response

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete: marca como inactivo en lugar de eliminar
        """
        patient = self.get_object()
        patient.is_active = False
        patient.save()
        
        # Invalidar cache - corregir para Redis
        try:
            # Para Redis, intentar limpiar claves específicas
            cache.delete_pattern('patients_list*')
        except AttributeError:
            # Si no es Redis, usar método alternativo
            cache.clear()
        
        logger.info(f"Paciente desactivado: ID {patient.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """
        Retorna historial médico completo del paciente
        """
        patient = self.get_object()
        
        medical_records = MedicalRecord.objects.filter(
            patient=patient
        ).select_related('patient').order_by('-fecha_registro')
        
        serializer = MedicalRecordSerializer(medical_records, many=True)
        
        return Response({
            'patient_id': patient.id,
            'patient_name': f"{patient.nombre} {patient.apellidos}",
            'medical_records': serializer.data,
            'total_records': medical_records.count()
        })

    @action(detail=False, methods=['get', 'post'])
    def search_by_dni(self, request):
        """
        Busca paciente por DNI para formularios de predicción
        """
        if request.method == 'GET':
            dni = request.query_params.get('dni')
        else:  # POST
            dni = request.data.get('dni')
        
        if not dni:
            return Response(
                {'error': 'DNI es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient = Patient.objects.select_related('medico_tratante').get(
                dni=dni, 
                is_active=True
            )
            
            serializer = PatientForPredictionSerializer(patient)
            return Response(serializer.data)
            
        except Patient.DoesNotExist:
            return Response(
                {
                    'error': 'Paciente no encontrado - Regístralo para continuar',
                    'message': 'No se encontró un paciente con ese DNI. Completa los datos manualmente y registra al paciente.',
                    'can_register': True
                }, 
                status=status.HTTP_200_OK
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estadísticas generales de pacientes
        """
        cache_key = 'patients_stats'
        cached_stats = cache.get(cache_key)
        
        if cached_stats:
            return Response(cached_stats)
        
        # Calcular estadísticas
        total_patients = Patient.objects.filter(is_active=True).count()
        
        # Distribución por sexo
        sex_distribution = Patient.objects.filter(is_active=True).values('sexo').annotate(
            count=Count('id')
        )
        
        # Pacientes por hospital
        hospital_distribution = Patient.objects.filter(is_active=True).values(
            'hospital'
        ).annotate(count=Count('id')).order_by('-count')[:10]
        
        # Pacientes activos por médico
        doctor_distribution = Patient.objects.filter(is_active=True).values(
            'medico_tratante__first_name', 
            'medico_tratante__last_name'
        ).annotate(count=Count('id')).order_by('-count')[:10]
        
        # Registros médicos recientes
        recent_records = MedicalRecord.objects.filter(
            patient__is_active=True
        ).count()
        
        stats = {
            'total_patients': total_patients,
            'sex_distribution': list(sex_distribution),
            'hospital_distribution': list(hospital_distribution),
            'doctor_distribution': list(doctor_distribution),
            'total_medical_records': recent_records,
            'generated_at': timezone.now()
        }
        
        # Cache por 1 hora
        cache.set(cache_key, stats, timeout=3600)
        
        return Response(stats)

    @action(detail=True, methods=['post'])
    def add_medical_record(self, request, pk=None):
        """
        Agrega un nuevo registro médico al paciente
        """
        patient = self.get_object()
        
        # Calcular edad del paciente
        from datetime import date
        today = date.today()
        age = today.year - patient.fecha_nacimiento.year - (
            (today.month, today.day) < (patient.fecha_nacimiento.month, patient.fecha_nacimiento.day)
        )
        
        # Preparar datos del registro médico
        medical_data = request.data.copy()
        medical_data['patient'] = patient.id
        medical_data['edad'] = age
        
        # Crear serializador para validación
        serializer = MedicalRecordSerializer(data=medical_data)
        
        if serializer.is_valid():
            medical_record = serializer.save()
            logger.info(f"Registro médico creado para paciente {patient.id}: {medical_record.id}")
            
            return Response(
                MedicalRecordSerializer(medical_record).data,
                status=status.HTTP_201_CREATED
            )
        
        logger.warning(f"Error creando registro médico: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()  # Queryset base requerido por DRF
    permission_classes = [IsAuthenticated]
    serializer_class = MedicalRecordSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['patient', 'actividad_fisica', 'antecedentes_cardiacos']  # Temporalmente deshabilitado
    search_fields = ['patient__nombre', 'patient__apellidos', 'patient__dni']
    ordering_fields = ['fecha_registro']
    ordering = ['-fecha_registro']

    def get_queryset(self):
        """Optimiza queryset con select_related y filtrado manual por paciente"""
        base_queryset = MedicalRecord.objects.select_related(
            'patient', 
            'patient__medico_tratante'
        ).order_by('-fecha_registro')
        
        # Aplicar filtros manuales
        patient = self.request.query_params.get('patient')
        if patient:
            base_queryset = base_queryset.filter(patient=patient)
            
        actividad_fisica = self.request.query_params.get('actividad_fisica')
        if actividad_fisica:
            base_queryset = base_queryset.filter(actividad_fisica=actividad_fisica)
            
        antecedentes_cardiacos = self.request.query_params.get('antecedentes_cardiacos')
        if antecedentes_cardiacos:
            base_queryset = base_queryset.filter(antecedentes_cardiacos=antecedentes_cardiacos)
        
        return base_queryset

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo registro médico con validación de paciente
        """
        logger.info(f"Creando registro médico para paciente: {request.data.get('patient')}")
        
        # Validar que el paciente existe y está activo
        patient_id = request.data.get('patient')
        if patient_id:
            try:
                patient = Patient.objects.get(id=patient_id, is_active=True)
                request.data['patient'] = patient.id
            except Patient.DoesNotExist:
                return Response({
                    'error': 'Paciente no encontrado o inactivo'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """
        Retorna registros médicos filtrados por paciente
        """
        patient_id = request.query_params.get('patient_id')
        
        if not patient_id:
            return Response({
                'error': 'patient_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = Patient.objects.get(id=patient_id, is_active=True)
        except Patient.DoesNotExist:
            return Response({
                'error': 'Paciente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        medical_records = self.get_queryset().filter(patient=patient)
        
        # Paginación manual si es necesaria
        page = self.paginate_queryset(medical_records)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(medical_records, many=True)
        return Response({
            'patient': {
                'id': patient.id,
                'name': f"{patient.nombre} {patient.apellidos}",
                'dni': patient.dni
            },
            'medical_records': serializer.data,
            'count': medical_records.count()
        })


# Vistas de función para operaciones específicas
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_dni(request):
    """
    Valida si un DNI ya existe en el sistema
    """
    dni = request.query_params.get('dni')
    
    if not dni:
        return Response({
            'error': 'DNI es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = Patient.objects.filter(dni=dni, is_active=True).exists()
    
    return Response({
        'dni': dni,
        'exists': exists
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_summary(request, patient_id):
    """
    Resumen completo de un paciente para dashboards
    """
    try:
        patient = Patient.objects.select_related('medico_tratante').prefetch_related(
            Prefetch(
                'medical_records',
                queryset=MedicalRecord.objects.order_by('-fecha_registro')[:5]
            ),
            'predictions'
        ).get(id=patient_id, is_active=True)
        
    except Patient.DoesNotExist:
        return Response({
            'error': 'Paciente no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Obtener últimas predicciones
    recent_predictions = getattr(patient, 'predictions', [])[:3] if hasattr(patient, 'predictions') else []
    
    summary = {
        'patient': PatientSerializer(patient).data,
        'recent_medical_records': MedicalRecordSerializer(patient.medical_records.all(), many=True).data,
        'recent_predictions_count': len(recent_predictions),
        'total_medical_records': patient.medical_records.count(),
        'last_medical_record_date': patient.medical_records.first().fecha_registro if patient.medical_records.exists() else None,
        'created_date': patient.created_at
    }
    
    return Response(summary)
