from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Cardiovascular Prediction System',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health checks
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='api-health-check'),
    path('ready/', health_check, name='ready-check'),
    
    # API endpoints
    path('api/patients/', include('apps.patients.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/authentication/', include('apps.authentication.urls')),
    
    # Token endpoints
    path('api/token/refresh/', include('apps.authentication.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
