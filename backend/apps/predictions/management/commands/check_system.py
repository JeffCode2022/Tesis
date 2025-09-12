"""
Comando para verificar la configuración del sistema y validar la integración
"""
from django.core.management.base import BaseCommand
from django.db import connection
from apps.predictions.services import PredictionService
from apps.predictions.validators import MedicalDataValidator
from apps.patients.models import Patient, MedicalRecord
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Verifica la configuración del sistema cardiovascular'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-prediction',
            action='store_true',
            help='Ejecuta un test de predicción con datos de ejemplo',
        )
        parser.add_argument(
            '--test-validation',
            action='store_true',
            help='Ejecuta tests de validación de datos médicos',
        )

    def handle(self, *args, **options):
        self.stdout.write("🔍 Verificando configuración del sistema...")
        
        # 1. Verificar conexión a base de datos
        self.check_database_connection()
        
        # 2. Verificar modelos ML
        self.check_ml_models()
        
        # 3. Verificar validador
        self.check_validator()
        
        # 4. Tests opcionales
        if options['test_prediction']:
            self.test_prediction_service()
            
        if options['test_validation']:
            self.test_validation_service()
        
        self.stdout.write(
            self.style.SUCCESS("✅ Verificación completada")
        )

    def check_database_connection(self):
        """Verifica la conexión a la base de datos"""
        try:
            from django.db import connection
            
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                result = cursor.fetchone()
                
                # Detectar tipo de base de datos
                db_engine = connection.settings_dict['ENGINE']
                
                if 'postgresql' in db_engine:
                    cursor.execute("SELECT version();")
                    db_version = cursor.fetchone()[0]
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ Conexión PostgreSQL exitosa: {db_version}")
                    )
                elif 'sqlite' in db_engine:
                    cursor.execute("SELECT sqlite_version();")
                    db_version = cursor.fetchone()[0]
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ Usando SQLite (desarrollo): v{db_version}")
                    )
                    self.stdout.write(
                        self.style.WARNING("📝 Para producción, configure PostgreSQL correctamente")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ Base de datos: {db_engine}")
                    )
                
        except Exception as e:
            error_msg = str(e)
            if 'password' in error_msg.lower():
                self.stdout.write(
                    self.style.ERROR("❌ Error de autenticación en PostgreSQL")
                )
                self.stdout.write("🔧 Soluciones:")
                self.stdout.write("  1. Verificar que PostgreSQL esté ejecutándose")
                self.stdout.write("  2. Verificar credenciales en .env")
                self.stdout.write("  3. Configurar usuario postgres con contraseña")
            elif 'connection' in error_msg.lower():
                self.stdout.write(
                    self.style.ERROR("❌ Error de conexión a PostgreSQL")
                )
                self.stdout.write("🔧 Verificar que PostgreSQL esté ejecutándose en localhost:5432")
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error de base de datos: {error_msg}")
                )

    def check_ml_models(self):
        """Verifica la disponibilidad de modelos ML"""
        try:
            service = PredictionService()
            
            model_status = "✅ Disponible" if service.is_model_available() else "❌ No disponible"
            scaler_status = "✅ Disponible" if service.is_scaler_available() else "❌ No disponible"
            
            self.stdout.write(f"Modelo ML: {model_status}")
            self.stdout.write(f"Scaler: {scaler_status}")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error verificando modelos ML: {e}")
            )

    def check_validator(self):
        """Verifica el validador de datos médicos"""
        try:
            validator = MedicalDataValidator()
            
            # Test básico del validador
            test_ranges = validator.VALIDATION_RANGES
            test_categories = validator.CATEGORICAL_VALUES
            
            self.stdout.write(f"✅ Validador inicializado")
            self.stdout.write(f"  - {len(test_ranges)} rangos de validación definidos")
            self.stdout.write(f"  - {len(test_categories)} categorías validadas")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error inicializando validador: {e}")
            )

    def test_prediction_service(self):
        """Test del servicio de predicción"""
        self.stdout.write("🧪 Ejecutando test de predicción...")
        
        try:
            # Crear datos de test
            from datetime import date
            from apps.authentication.models import User
            
            # Buscar o crear usuario de test
            user, created = User.objects.get_or_create(
                email='test@sistema.com',
                defaults={
                    'username': 'test_user',
                    'first_name': 'Test',
                    'last_name': 'User'
                }
            )
            
            # Crear paciente de test
            patient, created = Patient.objects.get_or_create(
                dni='12345678',
                defaults={
                    'nombre': 'Paciente',
                    'apellidos': 'Test',
                    'fecha_nacimiento': date(1980, 1, 1),
                    'sexo': 'M',
                    'peso': 75.0,
                    'altura': 175.0,
                    'numero_historia': 'TEST001',
                    'medico_tratante': user
                }
            )
            
            # Crear registro médico de test
            medical_record = MedicalRecord.objects.create(
                patient=patient,
                presion_sistolica=130,
                presion_diastolica=80,
                colesterol=180.0,
                glucosa=95.0,
                cigarrillos_dia=0,
                anos_tabaquismo=0,
                actividad_fisica='moderado',
                antecedentes_cardiacos='no'
            )
            
            # Ejecutar predicción
            service = PredictionService()
            prediction = service.get_prediction(patient, medical_record)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Predicción exitosa: {prediction.riesgo_nivel} "
                    f"({prediction.probabilidad:.1f}%)"
                )
            )
            
            # Limpiar datos de test
            medical_record.delete()
            if created:
                patient.delete()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error en test de predicción: {e}")
            )

    def test_validation_service(self):
        """Test del servicio de validación"""
        self.stdout.write("🧪 Ejecutando test de validación...")
        
        try:
            from datetime import date
            from apps.authentication.models import User
            
            validator = MedicalDataValidator()
            
            # Test con datos válidos
            user = User(email='test@test.com', username='test')
            
            patient_valid = Patient(
                dni='12345678',
                nombre='Test',
                apellidos='Patient',
                fecha_nacimiento=date(1980, 1, 1),
                sexo='M',
                peso=75.0,
                altura=175.0,
                numero_historia='TEST001'
            )
            
            record_valid = MedicalRecord(
                presion_sistolica=120,
                presion_diastolica=80,
                colesterol=180.0,
                glucosa=95.0,
                cigarrillos_dia=0,
                anos_tabaquismo=0,
                actividad_fisica='moderado',
                antecedentes_cardiacos='no'
            )
            
            result_valid = validator.validate_patient_data(patient_valid, record_valid)
            
            if result_valid.is_valid:
                self.stdout.write(self.style.SUCCESS("✅ Validación con datos válidos: PASÓ"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Validación falló: {result_valid.errors}"))
            
            # Test con datos inválidos
            patient_invalid = Patient(
                dni='12345678',
                nombre='Test',
                apellidos='Patient',
                fecha_nacimiento=date(1980, 1, 1),
                sexo='X',  # Sexo inválido
                peso=500.0,  # Peso inválido
                altura=50.0,  # Altura inválida
                numero_historia='TEST002'
            )
            
            record_invalid = MedicalRecord(
                presion_sistolica=300,  # Presión inválida
                presion_diastolica=200,  # Presión inválida
                colesterol=1000.0,  # Colesterol inválido
                glucosa=-10.0,  # Glucosa inválida
                cigarrillos_dia=-5,  # Negativo
                anos_tabaquismo=150,  # Imposible
                actividad_fisica='invalid',  # Valor inválido
                antecedentes_cardiacos='maybe'  # Valor inválido
            )
            
            result_invalid = validator.validate_patient_data(patient_invalid, record_invalid)
            
            if not result_invalid.is_valid and len(result_invalid.errors) > 0:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Validación con datos inválidos: DETECTÓ {len(result_invalid.errors)} errores")
                )
            else:
                self.stdout.write(self.style.ERROR("❌ Validación no detectó errores en datos inválidos"))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error en test de validación: {e}")
            )
