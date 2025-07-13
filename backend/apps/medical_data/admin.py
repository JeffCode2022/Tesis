from django.contrib import admin
from .models import MedicalData

@admin.register(MedicalData)
class MedicalDataAdmin(admin.ModelAdmin):
    """Configuración de la interfaz de administración para MedicalData."""
    
    list_display = ('patient', 'date_recorded', 'age', 'gender', 'display_risk_score')
    list_filter = ('gender', 'smoking', 'alcohol_consumption', 'physical_activity')
    search_fields = ('patient__nombre', 'patient__apellidos', 'previous_conditions')
    readonly_fields = ('date_recorded', 'display_risk_score', 'prediction_date')
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient', 'date_recorded')
        }),
        ('Datos Demográficos', {
            'fields': ('age', 'gender')
        }),
        ('Factores de Riesgo', {
            'fields': ('smoking', 'alcohol_consumption', 'physical_activity')
        }),
        ('Mediciones Clínicas', {
            'fields': ('systolic_pressure', 'diastolic_pressure', 'heart_rate',
                      'cholesterol', 'glucose')
        }),
        ('Historial Médico', {
            'fields': ('family_history', 'previous_conditions')
        }),
        ('Resultados de Predicción', {
            'fields': ('display_risk_score', 'prediction_date'),
            'classes': ('collapse',)
        }),
    ) 

    def display_risk_score(self, obj):
        if obj.risk_score is not None:
            return f"{obj.risk_score * 100:.1f}%"
        return "N/A"
    display_risk_score.short_description = 'Puntuación de Riesgo'