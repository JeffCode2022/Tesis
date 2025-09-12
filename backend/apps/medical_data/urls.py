from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configurar router para incluir trailing slash
router = DefaultRouter(trailing_slash=True)
router.register(r'medical-data', views.MedicalDataViewSet, basename='medical-data')
router.register(r'import', views.MedicalDataImportViewSet, basename='medical-data-import')
router.register(r'validation', views.DataValidationViewSet, basename='data-validation')

urlpatterns = [
    path('', include(router.urls)),
]
