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
    path('health/', health_check, name='health_check'),
    path('api/patients/', include('apps.patients.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/medical-data/', include('apps.medical_data.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/integration/', include('apps.integration.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
