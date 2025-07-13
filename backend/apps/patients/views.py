from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Subquery, OuterRef
from .models import Patient, MedicalRecord
from .serializers import (
    PatientSerializer, PatientCreateSerializer, PatientListSerializer,
    MedicalRecordSerializer, PatientDNISearchSerializer, PatientForPredictionSerializer
)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sexo', 'hospital', 'medico_tratante']
    search_fields = ['nombre', 'apellidos', 'numero_historia', 'email', 'dni']
    ordering_fields = ['created_at', 'nombre']
    ordering = ['-created_at']

    @property
    def paginator(self):
        """
        Desactiva la paginación si se pasa el parámetro 'no_pagination=true'.
        """
        if self.request.query_params.get('no_pagination', '').lower() == 'true':
            return None
        return super().paginator

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        elif self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        serializer.save(medico_tratante=self.request.user)

    @action(detail=False, methods=['get'], url_path='for-prediction')
    def for_prediction(self, request):
        """
        Endpoint optimizado que devuelve todos los pacientes con los datos de su último
        registro médico, listo para la predicción masiva. No utiliza paginación.
        """
        latest_record_subquery = MedicalRecord.objects.filter(
            patient=OuterRef('pk')
        ).order_by('-fecha_registro')

        patient_queryset = self.get_queryset().annotate(
            latest_sistolica=Subquery(latest_record_subquery.values('presion_sistolica')[:1]),
            latest_diastolica=Subquery(latest_record_subquery.values('presion_diastolica')[:1]),
            latest_colesterol=Subquery(latest_record_subquery.values('colesterol')[:1]),
            latest_glucosa=Subquery(latest_record_subquery.values('glucosa')[:1]),
            latest_cigarrillos=Subquery(latest_record_subquery.values('cigarrillos_dia')[:1]),
            latest_tabaquismo=Subquery(latest_record_subquery.values('anos_tabaquismo')[:1]),
            latest_actividad=Subquery(latest_record_subquery.values('actividad_fisica')[:1]),
            latest_antecedentes=Subquery(latest_record_subquery.values('antecedentes_cardiacos')[:1]),
        ).filter(latest_sistolica__isnull=False) # Solo pacientes con al menos un registro médico

        serializer = PatientForPredictionSerializer(patient_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def search_by_dni(self, request):
        serializer = PatientDNISearchSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.get_patient_data()
            return Response(result)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_medical_record(self, request, pk=None):
        try:
            patient = self.get_object()
            data = request.data.copy()
            data['patient'] = patient.id
            serializer = MedicalRecordSerializer(data=data)
            if serializer.is_valid():
                medical_record = serializer.save()
                return Response(MedicalRecordSerializer(medical_record).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Patient.DoesNotExist:
            return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        patient = self.get_object()
        records = patient.medical_records.all()
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_patients = self.get_queryset().count()
        by_gender = self.get_queryset().values('sexo').annotate(
            count=models.Count('id')
        )
        by_age_group = self._get_age_groups()
        
        return Response({
            'total_patients': total_patients,
            'by_gender': list(by_gender),
            'by_age_group': by_age_group
        })

    def _get_age_groups(self):
        from django.db.models import Case, When, IntegerField, Count
        
        return self.get_queryset().aggregate(
            group_18_30=Count(Case(When(edad__range=(18, 30), then=1), output_field=IntegerField())),
            group_31_45=Count(Case(When(edad__range=(31, 45), then=1), output_field=IntegerField())),
            group_46_60=Count(Case(When(edad__range=(46, 60), then=1), output_field=IntegerField())),
            group_60_plus=Count(Case(When(edad__gt=60, then=1), output_field=IntegerField())),
        )

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient', 'actividad_fisica', 'antecedentes_cardiacos']
    ordering = ['-fecha_registro']

    def perform_create(self, serializer):
        serializer.save()
        
    def perform_update(self, serializer):
        # Asegurarse de que el patient_id se mantenga igual al actualizar
        instance = self.get_object()
        
        # Si se envía el campo patient en los datos, asegurarse de que sea el mismo que el registro actual
        if 'patient' in serializer.validated_data:
            if str(serializer.validated_data['patient'].id) != str(instance.patient_id):
                # Si se intenta cambiar el paciente, mantener el original
                serializer.validated_data['patient'] = instance.patient
        else:
            # Si no se envía el campo patient, establecerlo con el valor actual
            serializer.validated_data['patient'] = instance.patient
            
        serializer.save()

    def get_queryset(self):
        queryset = MedicalRecord.objects.all()
        patient_id = self.request.query_params.get('patient', None)
        print(f"[MedicalRecordViewSet] patient_id recibido: {patient_id}")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
            print(f"[MedicalRecordViewSet] Registros encontrados: {queryset.count()}")
        return queryset.order_by('-fecha_registro')

    def list(self, request, *args, **kwargs):
        """Sobrescribir el método list para manejar mejor los filtros"""
        try:
            queryset = self.get_queryset()
            print(f"[MedicalRecordViewSet] QuerySet final: {queryset.count()} registros")
            
            # Aplicar paginación si es necesario
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"[MedicalRecordViewSet] Error en list: {str(e)}")
            return Response(
                {'error': 'Error al obtener registros médicos'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
