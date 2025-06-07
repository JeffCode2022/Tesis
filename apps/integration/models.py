from django.db import models
import uuid

class ExternalSystemIntegration(models.Model):
    """Configuración para integración con sistemas externos"""
    
    SYSTEM_TYPES = [
        ('HIS', 'Hospital Information System'),
        ('EMR', 'Electronic Medical Record'),
        ('LIS', 'Laboratory Information System'),
        ('PACS', 'Picture Archiving System'),
        ('API', 'Generic API'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    system_type = models.CharField(max_length=10, choices=SYSTEM_TYPES)
    base_url = models.URLField()
    api_key = models.CharField(max_length=500, blank=True)
    username = models.CharField(max_length=100, blank=True)
    password = models.CharField(max_length=100, blank=True)
    
    # Configuración de endpoints
    patient_endpoint = models.CharField(max_length=200, default='/api/patients/')
    medical_record_endpoint = models.CharField(max_length=200, default='/api/medical-records/')
    
    # Configuración de mapeo de campos
    field_mapping = models.JSONField(default=dict, help_text="Mapeo de campos del sistema externo")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.system_type})"

class IntegrationLog(models.Model):
    """Log de integraciones con sistemas externos"""
    
    LOG_TYPES = [
        ('IMPORT', 'Importación'),
        ('EXPORT', 'Exportación'),
        ('SYNC', 'Sincronización'),
        ('ERROR', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    integration = models.ForeignKey(ExternalSystemIntegration, on_delete=models.CASCADE)
    log_type = models.CharField(max_length=10, choices=LOG_TYPES)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.integration.name} - {self.log_type} - {self.created_at}"
