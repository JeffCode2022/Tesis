from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
import pandas as pd
import numpy as np

class DataValidationViewSet(ViewSet):
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """
        Valida los datos antes de la importación.
        """
        try:
            data = request.data.get('data', [])
            if not data:
                return Response(
                    {'message': 'No se proporcionaron datos para validar'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            errors = []
            validated_data = []

            for index, row in enumerate(data):
                row_errors = []
                
                # Validar campos requeridos
                required_fields = [
                    'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 
                    'peso', 'altura', 'presion_sistolica', 'presion_diastolica'
                ]
                
                for field in required_fields:
                    if not row.get(field):
                        row_errors.append(f'Campo {field} es requerido')

                # Validar formato DNI
                dni = row.get('dni', '')
                if not dni.isdigit() or len(dni) != 8:
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
