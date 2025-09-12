from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from apps.common.health_checks import health_check_view, ready_check_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Health Checks (NIVEL 1)
    path('health/', health_check_view, name='health-check'),
    path('ready/', ready_check_view, name='ready-check'),
    
    # API Documentation (NIVEL 1)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Endpoints
    path('api/authentication/', include('apps.authentication.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/medical-records/', include('apps.medical_data.urls')),
    path('api/patients/', include('apps.patients.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/integration/', include('apps.integration.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 