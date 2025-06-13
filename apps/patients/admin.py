from django.contrib import admin
from .models import Patient, MedicalRecord

admin.site.register(Patient)
admin.site.register(MedicalRecord) 