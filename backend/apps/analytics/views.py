from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, Case, When, CharField, Value
from django.utils import timezone
from datetime import timedelta
from apps.patients.models import Patient, MedicalRecord
from apps.predictions.models import Prediction

class AnalyticsViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        """Métricas principales del dashboard"""
        # Métricas básicas
        total_patients = Patient.objects.filter(is_active=True).count()
        total_predictions = Prediction.objects.count()
        high_risk_count = Prediction.objects.filter(riesgo_nivel='Alto').count()
        
        # Crecimiento mensual
        last_month = timezone.now() - timedelta(days=30)
        monthly_growth = Patient.objects.filter(created_at__gte=last_month).count()
        
        # Distribución de riesgo
        risk_distribution = Prediction.objects.values('riesgo_nivel').annotate(
            count=Count('id')
        ).order_by('riesgo_nivel')
        
        # Distribución por edad y riesgo
        age_risk_distribution = self._get_age_risk_distribution()
        
        # Factores de riesgo más comunes
        common_risk_factors = self._get_common_risk_factors()
        
        # Evolución mensual
        monthly_evolution = self._get_monthly_evolution()
        
        return Response({
            'total_patients': total_patients,
            'total_predictions': total_predictions,
            'high_risk_count': high_risk_count,
            'monthly_growth': monthly_growth,
            'risk_distribution': list(risk_distribution),
            'age_risk_distribution': age_risk_distribution,
            'common_risk_factors': common_risk_factors,
            'monthly_evolution': monthly_evolution,
            'model_accuracy': 97.3  # Valor fijo por ahora
        })
    
    def _get_age_risk_distribution(self):
        """Distribución de riesgo por grupos de edad"""
        predictions_with_age = Prediction.objects.select_related('patient').annotate(
            age_group=Case(
                When(patient__edad__lt=31, then=Value('18-30')),
                When(patient__edad__lt=46, then=Value('31-45')),
                When(patient__edad__lt=61, then=Value('46-60')),
                default=Value('60+')
            )
        )
        
        result = []
        for age_group in ['18-30', '31-45', '46-60', '60+']:
            group_predictions = predictions_with_age.filter(age_group=age_group)
            bajo = group_predictions.filter(riesgo_nivel='Bajo').count()
            medio = group_predictions.filter(riesgo_nivel='Medio').count()
            alto = group_predictions.filter(riesgo_nivel='Alto').count()
            
            result.append({
                'rango': age_group,
                'bajo': bajo,
                'medio': medio,
                'alto': alto
            })
        
        return result
    
    def _get_common_risk_factors(self):
        """Factores de riesgo más comunes"""
        # Análisis de registros médicos
        total_records = MedicalRecord.objects.count()
        
        if total_records == 0:
            return []
        
        # IMC elevado (>25)
        high_bmi = 0
        hypertension = MedicalRecord.objects.filter(presion_sistolica__gt=140).count()
        smoking = MedicalRecord.objects.filter(cigarrillos_dia__gt=0).count()
        sedentary = MedicalRecord.objects.filter(actividad_fisica='sedentario').count()
        
        # Calcular IMC para cada registro (simplificado)
        for record in MedicalRecord.objects.select_related('patient'):
            altura_m = record.patient.altura / 100
            imc = record.patient.peso / (altura_m ** 2)
            if imc > 25:
                high_bmi += 1
        
        return [
            {
                'factor': 'IMC Elevado',
                'pacientes': high_bmi,
                'porcentaje': round((high_bmi / total_records) * 100, 1)
            },
            {
                'factor': 'Hipertensión',
                'pacientes': hypertension,
                'porcentaje': round((hypertension / total_records) * 100, 1)
            },
            {
                'factor': 'Tabaquismo',
                'pacientes': smoking,
                'porcentaje': round((smoking / total_records) * 100, 1)
            },
            {
                'factor': 'Sedentarismo',
                'pacientes': sedentary,
                'porcentaje': round((sedentary / total_records) * 100, 1)
            }
        ]
    
    def _get_monthly_evolution(self):
        """Evolución mensual de predicciones"""
        from django.db.models.functions import TruncMonth
        
        monthly_data = Prediction.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            predicciones=Count('id'),
            precision=Avg('confidence_score')
        ).order_by('-month')[:6] # Obtener los últimos 6 meses en orden descendente
        
        result = []
        for data in list(monthly_data)[::-1]:  # Invertir para obtener orden ascendente
            result.append({
                'mes': data['month'].strftime('%b'),
                'predicciones': data['predicciones'],
                'precision': round((data['precision'] or 0.95) * 100, 1)
            })
        
        return result
