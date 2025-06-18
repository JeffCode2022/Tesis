from django.contrib import admin
from .models import User, MedicalStaffProfile
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'is_medical_staff', 'hospital', 'specialization', 'license_number', 'is_active', 'is_staff')
    list_filter = ('is_medical_staff', 'is_staff', 'is_superuser', 'is_active', 'hospital', 'specialization')
    search_fields = ('email', 'first_name', 'last_name', 'license_number')
    ordering = ('email',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'hospital', 'specialization', 'license_number', 'phone')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'is_medical_staff')}),
        ('Fechas', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'password1', 'password2', 'is_medical_staff', 'hospital', 'specialization', 'license_number', 'phone', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
    )

admin.site.register(User, UserAdmin)

class MedicalStaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'medical_id', 'department', 'years_experience', 'is_active')
    search_fields = ('user__email', 'medical_id', 'department')
    list_filter = ('department', 'is_active')

admin.site.register(MedicalStaffProfile, MedicalStaffProfileAdmin) 