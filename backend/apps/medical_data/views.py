import csv
import json
import io
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from apps.patients.models import Patient, MedicalRecord
from apps.patients.serializers import PatientCreateSerializer
from .models import MedicalData
from .serializers import MedicalDataSerializer

class DataValidationViewSet(viewsets.ViewSet):
    """ViewSet para validación de datos médicos"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Valida los datos antes de la importación"""
        print(f"DEBUG: validate() llamado con método: {request.method}")
        print(f"DEBUG: URL completa: {request.build_absolute_uri()}")
        print(f"DEBUG: Headers: {dict(request.headers)}")
        try:
            data = request.data.get('data', [])
            print(f"DEBUG: Datos recibidos para validación: {data}")  # Debug
            if not data:
                return Response(
                    {'message': 'No se proporcionaron datos para validar'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            errors = []
            validated_data = []

            for index, row in enumerate(data):
                row_errors = []
                print(f"DEBUG: Procesando fila {index + 1}: {row}")  # Debug
                
                # Validar campos requeridos
                required_fields = [
                    'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 
                    'peso', 'altura', 'presion_sistolica', 'presion_diastolica'
                ]
                
                for field in required_fields:
                    value = row.get(field)
                    if not value or (isinstance(value, str) and not value.strip()):
                        row_errors.append(f'Campo {field} es requerido')
                        print(f"DEBUG: Campo {field} faltante o vacío")  # Debug

                # Validar formato DNI
                dni = str(row.get('dni', ''))  # Convertir a string
                print(f"DEBUG: DNI recibido: '{dni}'")  # Debug
                if not dni or not dni.isdigit() or len(dni) != 8:
                    row_errors.append('DNI debe tener 8 dígitos')

                # Validar valores numéricos
                numeric_fields = {
                    'peso': (30, 200),  # kg
                    'altura': (100, 250),  # cm
                    'presion_sistolica': (60, 250),  # mmHg
                    'presion_diastolica': (40, 150),  # mmHg
                    'colesterol': (100, 500),  # mg/dL
                    'glucosa': (50, 500),  # mg/dL
                }

                for field, (min_val, max_val) in numeric_fields.items():
                    value = row.get(field)
                    if value:
                        try:
                            num_value = float(value)
                            if not min_val <= num_value <= max_val:
                                row_errors.append(
                                    f'{field} debe estar entre {min_val} y {max_val}'
                                )
                        except ValueError:
                            row_errors.append(f'{field} debe ser un número')

                # Si hay errores en esta fila, agregarlos
                if row_errors:
                    errors.append({
                        'row': index + 1,
                        'errors': row_errors
                    })
                else:
                    validated_data.append(row)

            # Devolver resultado
            return Response({
                'isValid': len(errors) == 0,
                'errors': errors,
                'data': validated_data if len(errors) == 0 else None
            })

        except Exception as e:
            return Response(
                {'message': f'Error en la validación: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def test_prediction(self, request):
        """Prueba la predicción con un paciente de muestra"""
        try:
            patient_data = request.data.get('patient', {})
            if not patient_data:
                return Response(
                    {'message': 'No se proporcionaron datos del paciente'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Simular una prueba de predicción (aquí podrías llamar al servicio real)
            # Por ahora solo validamos que los campos necesarios estén presentes
            required_prediction_fields = [
                'peso', 'altura', 'presion_sistolica', 'presion_diastolica',
                'colesterol', 'glucosa', 'cigarrillos_dia', 'anos_tabaquismo',
                'actividad_fisica', 'antecedentes_cardiacos'
            ]
            
            missing_fields = []
            for field in required_prediction_fields:
                if not patient_data.get(field):
                    missing_fields.append(field)
            
            if missing_fields:
                return Response(
                    {'message': f'Faltan campos requeridos para predicción: {", ".join(missing_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'success': True,
                'message': 'Prueba de predicción exitosa'
            })

        except Exception as e:
            return Response(
                {'message': f'Error en la prueba de predicción: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MedicalDataImportViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=False, methods=['post'])
    def upload_file(self, request):
        """Importar datos desde archivo CSV/JSON"""
        if 'file' not in request.FILES:
            return Response({'error': 'No se proporcionó archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        try:
            if file.name.endswith('.csv'):
                return self._process_csv(file, request.user)
            elif file.name.endswith('.json'):
                return self._process_json(file, request.user)
            else:
                return Response({'error': 'Formato no soportado'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Error procesando archivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def process_text(self, request):
        """Procesar datos de texto manual"""
        text_data = request.data.get('text_data', '')
        
        if not text_data:
            return Response({'error': 'No se proporcionaron datos'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            return self._process_text_data(text_data, request.user)
        except Exception as e:
            return Response({'error': f'Error procesando datos: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _process_csv(self, file, user):
        """Procesar archivo CSV"""
        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_patients = []
        errors = []
        
        for row_num, row in enumerate(reader, start=1):
            try:
                patient_data = self._map_csv_row(row)
                patient = self._create_patient_with_record(patient_data, user)
                created_patients.append(patient)
            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")
        
        return Response({
            'message': f'Procesados {len(created_patients)} pacientes',
            'created_count': len(created_patients),
            'errors': errors
        })
    
    def _process_json(self, file, user):
        """Procesar archivo JSON"""
        data = json.load(file)
        
        if not isinstance(data, list):
            return Response({'error': 'El JSON debe contener una lista de pacientes'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_patients = []
        errors = []
        
        for index, patient_data in enumerate(data):
            try:
                patient = self._create_patient_with_record(patient_data, user)
                created_patients.append(patient)
            except Exception as e:
                errors.append(f"Registro {index + 1}: {str(e)}")
        
        return Response({
            'message': f'Procesados {len(created_patients)} pacientes',
            'created_count': len(created_patients),
            'errors': errors
        })
    
    def _process_text_data(self, text_data, user):
        """Procesar datos de texto separados por comas"""
        lines = text_data.strip().split('\n')
        created_patients = []
        errors = []
        
        for line_num, line in enumerate(lines, start=1):
            if not line.strip():
                continue
                
            try:
                values = [v.strip() for v in line.split(',')]
                patient_data = self._map_text_values(values)
                patient = self._create_patient_with_record(patient_data, user)
                created_patients.append(patient)
            except Exception as e:
                errors.append(f"Línea {line_num}: {str(e)}")
        
        return Response({
            'message': f'Procesados {len(created_patients)} pacientes',
            'created_count': len(created_patients),
            'errors': errors
        })
    
    def _map_csv_row(self, row):
        """Mapear fila CSV a datos de paciente"""
        return {
            'nombre': row.get('nombre', '').strip(),
            'apellidos': row.get('apellidos', '').strip(),
            'edad': int(row.get('edad', 0)),
            'sexo': row.get('sexo', 'M').upper()[0],
            'peso': float(row.get('peso', 70)),
            'altura': float(row.get('altura', 170)),
            'telefono': row.get('telefono', ''),
            'email': row.get('email', ''),
            'numero_historia': row.get('numero_historia', f"AUTO_{timezone.now().timestamp()}"),
            'hospital': row.get('hospital', 'Policlínico Laura Caller'),
            'medical_record': {
                'presion_sistolica': int(row.get('presion_sistolica', 120)),
                'presion_diastolica': int(row.get('presion_diastolica', 80)),
                'colesterol': float(row.get('colesterol', 200)) if row.get('colesterol') else None,
                'glucosa': float(row.get('glucosa', 100)) if row.get('glucosa') else None,
                'cigarrillos_dia': int(row.get('cigarrillos_dia', 0)),
                'anos_tabaquismo': int(row.get('anos_tabaquismo', 0)),
                'actividad_fisica': row.get('actividad_fisica', 'sedentario'),
                'antecedentes_cardiacos': row.get('antecedentes_cardiacos', 'no'),
            }
        }
    
    def _map_text_values(self, values):
        """Mapear valores de texto a datos de paciente"""
        # Formato esperado: nombre,edad,presion,colesterol,sexo
        if len(values) < 2:
            raise ValueError("Datos insuficientes")
        
        from django.utils import timezone
        
        return {
            'nombre': values[0] if len(values) > 0 else 'Paciente',
            'apellidos': values[1] if len(values) > 1 else 'Apellido',
            'edad': int(values[1]) if len(values) > 1 and values[1].isdigit() else 45,
            'sexo': values[4][0].upper() if len(values) > 4 else 'M',
            'peso': 70.0,
            'altura': 170.0,
            'numero_historia': f"AUTO_{int(timezone.now().timestamp())}",
            'hospital': 'Policlínico Laura Caller',
            'medical_record': {
                'presion_sistolica': int(values[2].split('/')[0]) if len(values) > 2 and '/' in values[2] else 120,
                'presion_diastolica': int(values[2].split('/')[1]) if len(values) > 2 and '/' in values[2] else 80,
                'colesterol': float(values[3]) if len(values) > 3 and values[3].replace('.', '').isdigit() else None,
                'glucosa': None,
                'cigarrillos_dia': 0,
                'anos_tabaquismo': 0,
                'actividad_fisica': 'sedentario',
                'antecedentes_cardiacos': 'no',
            }
        }
    
    def _create_patient_with_record(self, patient_data, user):
        """Crear paciente con registro médico"""
        from django.utils import timezone
        
        # Generar número de historia único si no se proporciona
        if not patient_data.get('numero_historia'):
            patient_data['numero_historia'] = f"AUTO_{int(timezone.now().timestamp())}"
        
        # Verificar si ya existe un paciente con ese número de historia
        if Patient.objects.filter(numero_historia=patient_data['numero_historia']).exists():
            patient_data['numero_historia'] = f"{patient_data['numero_historia']}_{int(timezone.now().timestamp())}"
        
        serializer = PatientCreateSerializer(data=patient_data, context={'request': type('obj', (object,), {'user': user})()})
        serializer.is_valid(raise_exception=True)
        return serializer.save()

class MedicalDataViewSet(viewsets.ModelViewSet):
    """ViewSet para manejar los datos médicos."""
    queryset = MedicalData.objects.all()
    serializer_class = MedicalDataSerializer
    
    def get_queryset(self):
        """Filtrar datos médicos por paciente si se proporciona el ID."""
        queryset = MedicalData.objects.all()
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def patient_summary(self, request):
        """Obtener resumen de datos médicos por paciente."""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'Se requiere ID de paciente'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = Patient.objects.get(id=patient_id)
            medical_data = MedicalData.objects.filter(patient=patient).order_by('-date_recorded')
            
            if not medical_data.exists():
                return Response({'error': 'No hay datos médicos para este paciente'}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            latest_data = medical_data.first()
            summary = {
                'patient_name': f"{patient.nombre} {patient.apellidos}",
                'latest_record': {
                    'date': latest_data.date_recorded,
                    'risk_score': latest_data.risk_score,
                    'systolic_pressure': latest_data.systolic_pressure,
                    'diastolic_pressure': latest_data.diastolic_pressure,
                    'heart_rate': latest_data.heart_rate,
                },
                'total_records': medical_data.count(),
                'risk_trend': list(medical_data.values('date_recorded', 'risk_score')[:10])
            }
            
            return Response(summary)
        except Patient.DoesNotExist:
            return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
