from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PatientViewSet)
router.register(r'medical-records', views.MedicalRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
