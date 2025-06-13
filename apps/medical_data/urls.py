from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'medical-data', views.MedicalDataViewSet, basename='medical-data')
router.register(r'import', views.MedicalDataImportViewSet, basename='medical-data-import')

urlpatterns = [
    path('', include(router.urls)),
]
