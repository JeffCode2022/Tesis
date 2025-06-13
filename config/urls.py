from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/authentication/', include('apps.authentication.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/medical-records/', include('apps.medical_data.urls')),
    path('api/patients/', include('apps.patients.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/integration/', include('apps.integration.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 