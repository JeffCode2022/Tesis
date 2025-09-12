import os
from celery import Celery
from django.conf import settings

# Set default Django settings module for Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('cardiovascular_system')

# Configure Celery using Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs
app.autodiscover_tasks()

# Configuration
app.conf.update(
    # Redis broker configuration
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    
    # Task serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Lima',
    enable_utc=True,
    
    # Task routing
    task_routes={
        'apps.predictions.tasks.*': {'queue': 'predictions'},
        'apps.integration.tasks.*': {'queue': 'integration'},
        'apps.analytics.tasks.*': {'queue': 'analytics'},
    },
    
    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Task execution
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes
    task_compression='gzip',
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        'cleanup-old-predictions': {
            'task': 'apps.predictions.tasks.cleanup_old_predictions',
            'schedule': 86400.0,  # Daily
        },
        'sync-external-data': {
            'task': 'apps.integration.tasks.sync_external_data',
            'schedule': 3600.0,   # Hourly
        },
        'generate-analytics-report': {
            'task': 'apps.analytics.tasks.generate_daily_report',
            'schedule': 21600.0,  # Every 6 hours
        },
    },
)

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    import logging
    logger = logging.getLogger('cardiovascular.celery')
    logger.info(f'Debug task executed: {self.request!r}')
    return f'Debug task completed: {self.request.id}'
