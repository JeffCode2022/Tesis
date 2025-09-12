from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PatientViewSet)
router.register(r'medical-records', views.MedicalRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('patients/<uuid:pk>/add_medical_record/', views.PatientViewSet.as_view({'post': 'add_medical_record'}), name='patient-add-medical-record'),
    path('patients/search_by_dni/', views.PatientViewSet.as_view({'get': 'search_by_dni', 'post': 'search_by_dni'}), name='patient-search-by-dni'),
]
