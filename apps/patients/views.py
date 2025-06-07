from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Patient, MedicalRecord
from .serializers import (
    PatientSerializer, PatientCreateSerializer, PatientListSerializer,
    MedicalRecordSerializer
)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sexo', 'hospital', 'medico_tratante']
    search_fields = ['nombre', 'apellidos', 'numero_historia', 'email']
    ordering_fields = ['created_at', 'edad', 'nombre']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        elif self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        serializer.save(medico_tratante=self.request.user)

    @action(detail=True, methods=['post'])
    def add_medical_record(self, request, pk=None):
        patient = self.get_object()
        serializer = MedicalRecordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                patient=patient,
                medico_registro=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        serializer.save(medico_registro=self.request.user)
