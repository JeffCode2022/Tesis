"""
Tareas asíncronas para análisis y generación de reportes
"""

import logging
from celery import shared_task
from django.conf import settings
from django.db import models
from django.core.mail import send_mail
from datetime import datetime, timedelta
from apps.patients.models import Patient, MedicalRecord
from apps.predictions.models import PredictionResult

logger = logging.getLogger('cardiovascular.analytics')

@shared_task
def generate_daily_report():
    """
    Genera reporte diario de actividad del sistema
    """
    try:
        logger.info("Generando reporte diario del sistema")
        
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        
        # Estadísticas del día anterior
        daily_stats = {
            'date': yesterday.isoformat(),
            'new_patients': Patient.objects.filter(created_at__date=yesterday).count(),
            'new_medical_records': MedicalRecord.objects.filter(created_at__date=yesterday).count(),
            'predictions_made': PredictionResult.objects.filter(created_at__date=yesterday).count(),
        }
        
        # Distribución de riesgo
        predictions_yesterday = PredictionResult.objects.filter(created_at__date=yesterday)
        risk_distribution = {
            'high_risk': predictions_yesterday.filter(risk_level='Alto').count(),
            'medium_risk': predictions_yesterday.filter(risk_level='Medio').count(),
            'low_risk': predictions_yesterday.filter(risk_level='Bajo').count(),
        }
        
        # Confianza promedio
        avg_confidence = predictions_yesterday.aggregate(
            avg=models.Avg('confidence_score')
        )['avg'] or 0
        
        # Estadísticas acumuladas (últimos 30 días)
        last_30_days = today - timedelta(days=30)
        monthly_stats = {
            'total_patients': Patient.objects.filter(created_at__date__gte=last_30_days).count(),
            'total_predictions': PredictionResult.objects.filter(created_at__date__gte=last_30_days).count(),
            'high_risk_cases': PredictionResult.objects.filter(
                created_at__date__gte=last_30_days,
                risk_level='Alto'
            ).count(),
        }
        
        report_data = {
            'generated_at': datetime.now().isoformat(),
            'daily_stats': daily_stats,
            'risk_distribution': risk_distribution,
            'average_confidence': round(avg_confidence, 4),
            'monthly_stats': monthly_stats
        }
        
        # Enviar reporte por email si está configurado
        if hasattr(settings, 'DAILY_REPORT_EMAILS') and settings.DAILY_REPORT_EMAILS:
            send_daily_report_email.delay(report_data)
        
        logger.info(f"Reporte diario generado: {daily_stats['predictions_made']} predicciones, {daily_stats['new_patients']} pacientes nuevos")
        
        return {
            'success': True,
            'report_data': report_data
        }
        
    except Exception as e:
        logger.error(f"Error generando reporte diario: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def send_daily_report_email(report_data):
    """
    Envía el reporte diario por email
    
    Args:
        report_data: Datos del reporte generado
    """
    try:
        daily_stats = report_data['daily_stats']
        risk_dist = report_data['risk_distribution']
        monthly_stats = report_data['monthly_stats']
        
        subject = f"Reporte Diario Sistema Cardiovascular - {daily_stats['date']}"
        
        message = f"""
        REPORTE DIARIO DEL SISTEMA CARDIOVASCULAR
        ========================================
        
        Fecha: {daily_stats['date']}
        Generado: {report_data['generated_at']}
        
        ACTIVIDAD DEL DÍA:
        ------------------
        • Pacientes nuevos: {daily_stats['new_patients']}
        • Registros médicos nuevos: {daily_stats['new_medical_records']}
        • Predicciones realizadas: {daily_stats['predictions_made']}
        
        DISTRIBUCIÓN DE RIESGO:
        ----------------------
        • Alto Riesgo: {risk_dist['high_risk']} casos
        • Riesgo Medio: {risk_dist['medium_risk']} casos
        • Bajo Riesgo: {risk_dist['low_risk']} casos
        
        CONFIANZA PROMEDIO: {report_data['average_confidence']:.2%}
        
        ESTADÍSTICAS MENSUALES (últimos 30 días):
        ----------------------------------------
        • Total pacientes: {monthly_stats['total_patients']}
        • Total predicciones: {monthly_stats['total_predictions']}
        • Casos alto riesgo: {monthly_stats['high_risk_cases']}
        
        ---
        Sistema de Predicción Cardiovascular
        Policlínico Laura Caller
        """
        
        recipient_list = getattr(settings, 'DAILY_REPORT_EMAILS', [])
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        logger.info(f"Reporte diario enviado a {len(recipient_list)} destinatarios")
        
        return {
            'success': True,
            'recipients': len(recipient_list)
        }
        
    except Exception as e:
        logger.error(f"Error enviando reporte diario por email: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def analyze_prediction_accuracy():
    """
    Analiza la precisión del modelo de predicción (requiere datos de seguimiento)
    """
    try:
        logger.info("Analizando precisión del modelo de predicción")
        
        # Obtener predicciones de alto riesgo de los últimos 30 días
        thirty_days_ago = datetime.now() - timedelta(days=30)
        high_risk_predictions = PredictionResult.objects.filter(
            created_at__gte=thirty_days_ago,
            risk_level='Alto'
        )
        
        total_high_risk = high_risk_predictions.count()
        
        # Aquí se implementaría la lógica para verificar outcomes reales
        # Por ahora, simulamos algunos cálculos básicos
        
        analysis_data = {
            'analysis_date': datetime.now().isoformat(),
            'period_days': 30,
            'total_high_risk_predictions': total_high_risk,
            'analysis_type': 'basic_stats',
            'confidence_metrics': {
                'avg_confidence': high_risk_predictions.aggregate(
                    avg=models.Avg('confidence_score')
                )['avg'] or 0,
                'min_confidence': high_risk_predictions.aggregate(
                    min=models.Min('confidence_score')
                )['min'] or 0,
                'max_confidence': high_risk_predictions.aggregate(
                    max=models.Max('confidence_score')
                )['max'] or 0,
            }
        }
        
        logger.info(f"Análisis de precisión completado: {total_high_risk} predicciones de alto riesgo analizadas")
        
        return {
            'success': True,
            'analysis_data': analysis_data
        }
        
    except Exception as e:
        logger.error(f"Error analizando precisión del modelo: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def generate_risk_trends_report():
    """
    Genera reporte de tendencias de riesgo cardiovascular
    """
    try:
        logger.info("Generando reporte de tendencias de riesgo")
        
        # Últimos 90 días de datos
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        # Obtener predicciones por semana
        weekly_data = []
        current_date = start_date
        
        while current_date < end_date:
            week_end = current_date + timedelta(days=7)
            
            week_predictions = PredictionResult.objects.filter(
                created_at__range=[current_date, week_end]
            )
            
            total_week = week_predictions.count()
            high_risk_week = week_predictions.filter(risk_level='Alto').count()
            
            weekly_data.append({
                'week_start': current_date.isoformat(),
                'week_end': week_end.isoformat(),
                'total_predictions': total_week,
                'high_risk_count': high_risk_week,
                'high_risk_percentage': (high_risk_week / total_week * 100) if total_week > 0 else 0
            })
            
            current_date = week_end
        
        # Calcular tendencias
        high_risk_percentages = [week['high_risk_percentage'] for week in weekly_data if week['total_predictions'] > 0]
        
        if len(high_risk_percentages) >= 2:
            trend = 'increasing' if high_risk_percentages[-1] > high_risk_percentages[0] else 'decreasing'
            if abs(high_risk_percentages[-1] - high_risk_percentages[0]) < 1:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        trends_report = {
            'generated_at': datetime.now().isoformat(),
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'weeks_analyzed': len(weekly_data)
            },
            'weekly_data': weekly_data,
            'overall_trend': trend,
            'average_high_risk_percentage': sum(high_risk_percentages) / len(high_risk_percentages) if high_risk_percentages else 0
        }
        
        logger.info(f"Reporte de tendencias generado: {len(weekly_data)} semanas analizadas, tendencia {trend}")
        
        return {
            'success': True,
            'trends_report': trends_report
        }
        
    except Exception as e:
        logger.error(f"Error generando reporte de tendencias: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def cleanup_analytics_data():
    """
    Limpia datos de análisis antiguos para optimizar performance
    """
    try:
        logger.info("Limpiando datos de análisis antiguos")
        
        # Por ahora, solo registramos la actividad
        # En el futuro se implementaría la limpieza real de datos agregados
        
        cleanup_summary = {
            'cleanup_date': datetime.now().isoformat(),
            'action': 'cleanup_scheduled',
            'status': 'pending_implementation'
        }
        
        logger.info("Limpieza de datos de análisis programada")
        
        return {
            'success': True,
            'cleanup_summary': cleanup_summary
        }
        
    except Exception as e:
        logger.error(f"Error en limpieza de datos de análisis: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
