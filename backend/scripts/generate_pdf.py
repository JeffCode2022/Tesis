from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os
import json

def generate_api_documentation_pdf():
    # Obtener la ruta del directorio actual
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    # Rutas de los archivos
    pdf_file = os.path.join(project_root, 'docs', 'api', 'API_DOCUMENTATION.pdf')
    
    # Asegurarse de que el directorio existe
    os.makedirs(os.path.dirname(pdf_file), exist_ok=True)
    
    # Crear el documento
    doc = SimpleDocTemplate(pdf_file, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12
    )
    
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=10,
        leading=12,
        backColor=colors.lightgrey,
        borderPadding=5,
        borderWidth=1,
        borderColor=colors.grey,
        borderRadius=2
    )
    
    story = []
    
    # Título
    story.append(Paragraph("Documentación de la API del Sistema Cardiovascular", title_style))
    
    # Contexto General
    story.append(Paragraph("Esta documentación describe los endpoints de la API del Sistema Cardiovascular, "
                           "diseñada para la gestión de pacientes, registros médicos, predicciones de riesgo "
                           "cardiovascular y la integración con sistemas externos. La API facilita el acceso y "
                           "manipulación de datos para aplicaciones de salud y herramientas de análisis.", styles['Normal']))
    story.append(Spacer(1, 24))
    
    # Índice
    story.append(Paragraph("Índice", heading2_style))
    story.append(Spacer(1, 12))
    
    # Contenido detallado
    sections = [
        ("Autenticación", [
            ("Obtener Token", {
                "method": "POST /api/token/",
                "description": "Autentica a un usuario y devuelve un token de acceso y un token de refresco.",
                "body": {
                    "username": "usuario",
                    "password": "contraseña"
                },
                "response": {
                    "access": "<jwt_access_token>",
                    "refresh": "<jwt_refresh_token>"
                }
            }),
            ("Refrescar Token", {
                "method": "POST /api/token/refresh/",
                "description": "Refresca un token de acceso expirado utilizando un token de refresco válido.",
                "body": {
                    "refresh": "<jwt_refresh_token>"
                },
                "response": {
                    "access": "<nuevo_jwt_access_token>"
                }
            })
        ]),
        ("Módulo de Pacientes", [
            ("Listar Pacientes", {
                "method": "GET /api/patients/",
                "description": "Recupera una lista paginada de todos los pacientes registrados, con opciones de filtro y búsqueda.",
                "query_params": ["sexo", "hospital", "medico_tratante", "search", "ordering", "page", "page_size"],
                "response": {
                    "count": 1,
                    "results": [{
                        "id": "uuid-paciente",
                        "nombre_completo": "Juan Pérez",
                        "edad": 45,
                        "sexo": "M",
                        "imc": 28.5,
                        "numero_historia": "H1234",
                        "ultimo_registro": "2024-03-20T10:00:00Z",
                        "riesgo_actual": "Alto"
                    }]
                }
            }),
            ("Obtener Paciente", {
                "method": "GET /api/patients/{id}/",
                "description": "Recupera los detalles de un paciente específico utilizando su ID."
            }),
            ("Crear Paciente", {
                "method": "POST /api/patients/",
                "description": "Crea un nuevo registro de paciente en el sistema.",
                "body": {
                    "name": "Juan Pérez",
                    "age": 45,
                    "gender": "M"
                }
            }),
            ("Actualizar Paciente", {
                "method": "PUT/PATCH /api/patients/{id}/",
                "description": "Actualiza parcial o completamente los detalles de un paciente existente."
            }),
            ("Eliminar Paciente", {
                "method": "DELETE /api/patients/{id}/",
                "description": "Elimina un registro de paciente del sistema."
            })
        ]),
        ("Módulo de Registros Médicos", [
            ("Listar Registros", {
                "method": "GET /api/patients/medical-records/",
                "description": "Recupera una lista de todos los registros médicos disponibles."
            }),
            ("Obtener Registro", {
                "method": "GET /api/patients/medical-records/{id}/",
                "description": "Recupera los detalles de un registro médico específico por su ID."
            }),
            ("Crear Registro", {
                "method": "POST /api/patients/medical-records/",
                "description": "Crea un nuevo registro médico asociado a un paciente.",
                "body": {
                    "patient_id": 1,
                    "blood_pressure": "120/80",
                    "heart_rate": 75,
                    "cholesterol": 200,
                    "glucose": 95
                }
            })
        ]),
        ("Módulo de Predicciones", [
            ("Listar Predicciones", {
                "method": "GET /api/predictions/",
                "description": "Recupera una lista de todas las predicciones de riesgo cardiovascular realizadas."
            }),
            ("Obtener Predicción", {
                "method": "GET /api/predictions/{id}/",
                "description": "Recupera los detalles de una predicción específica por su ID."
            }),
            ("Crear Predicción", {
                "method": "POST /api/predictions/",
                "description": "Realiza una nueva predicción de riesgo cardiovascular para un paciente dado.",
                "body": {
                    "patient_id": 1,
                    "medical_data": {
                        "presion_sistolica": 140,
                        "presion_diastolica": 90,
                        "colesterol_total": 240,
                        "colesterol_hdl": 45,
                        "glucosa": 110,
                        "imc": 28.5
                    }
                }
            }),
            ("Predicción en Lote", {
                "method": "POST /api/predictions/batch_predict/",
                "description": "Realiza predicciones de riesgo cardiovascular para múltiples pacientes en una sola solicitud.",
                "body": {
                    "data": [{
                        "patient_id": 1,
                        "medical_data": {
                            "presion_sistolica": 140,
                            "presion_diastolica": 90,
                            "colesterol_total": 240,
                            "colesterol_hdl": 45,
                            "glucosa": 110,
                            "imc": 28.5
                        }
                    }]
                }
            }),
            ("Métricas de Rendimiento", {
                "method": "GET /api/predictions/performance_metrics/",
                "description": "Obtiene métricas de rendimiento del modelo de predicción.",
                "note": "Requiere permisos de administrador"
            })
        ]),
        ("Módulo de Datos Médicos", [
            ("Listar Datos", {
                "method": "GET /api/medical-data/",
                "description": "Recupera una lista de todos los datos médicos brutos disponibles."
            }),
            ("Importar Datos", {
                "method": "POST /api/medical-data/import/",
                "description": "Permite la importación de un conjunto de datos médicos al sistema."
            })
        ]),
        ("Módulo de Integración", [
            ("Predicción en Lote", {
                "method": "POST /api/integration/bulk_predict/",
                "description": "Permite la integración y predicción en lote desde un sistema externo.",
                "body": {
                    "external_patient_ids": ["12345", "67890", "11111"],
                    "integration_name": "HIS_Principal"
                }
            })
        ])
    ]
    
    for section_title, endpoints in sections:
        story.append(Paragraph(section_title, heading2_style))
        story.append(Spacer(1, 12))
        
        for endpoint_name, endpoint_data in endpoints:
            # Título del endpoint
            story.append(Paragraph(endpoint_name, styles['Heading3']))
            story.append(Spacer(1, 6))
            
            # Descripción del endpoint
            if 'description' in endpoint_data:
                story.append(Paragraph(endpoint_data['description'], styles['Normal']))
                story.append(Spacer(1, 6))
            
            # Método
            story.append(Paragraph(f"Método: {endpoint_data['method']}", styles['Normal']))
            story.append(Spacer(1, 6))
            
            # Body si existe
            if 'body' in endpoint_data:
                story.append(Paragraph("Cuerpo de la Consulta (JSON):", styles['Normal']))
                story.append(Preformatted(json.dumps(endpoint_data['body'], indent=2), code_style))
                story.append(Spacer(1, 6))
            
            # Query params si existen
            if 'query_params' in endpoint_data:
                story.append(Paragraph("Query Params:", styles['Normal']))
                story.append(Paragraph(", ".join(endpoint_data['query_params']), styles['Normal']))
                story.append(Spacer(1, 6))
            
            # Response si existe
            if 'response' in endpoint_data:
                story.append(Paragraph("Respuesta (JSON) (200 OK):", styles['Normal']))
                story.append(Preformatted(json.dumps(endpoint_data['response'], indent=2), code_style))
                story.append(Spacer(1, 6))
            
            # Nota si existe
            if 'note' in endpoint_data:
                story.append(Paragraph(f"Nota: {endpoint_data['note']}", styles['Italic']))
                story.append(Spacer(1, 6))
            
            story.append(Spacer(1, 12))
    
    # Códigos de Error
    story.append(Paragraph("Códigos de Error", heading2_style))
    story.append(Spacer(1, 12))
    
    error_codes = [
        ["400", "Bad Request - Error en los datos enviados"],
        ["401", "Unauthorized - No autenticado"],
        ["403", "Forbidden - No tiene permisos"],
        ["404", "Not Found - Recurso no encontrado"],
        ["500", "Internal Server Error - Error del servidor"]
    ]
    
    error_table = Table(error_codes, colWidths=[1*inch, 5*inch])
    error_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(error_table)
    story.append(Spacer(1, 20))
    
    # Notas Importantes
    story.append(Paragraph("Notas Importantes", heading2_style))
    story.append(Spacer(1, 12))
    
    notes = [
        "1. Todos los endpoints requieren autenticación mediante JWT excepto /api/token/ y /api/token/refresh/",
        "2. Para endpoints que requieren permisos de administrador, el usuario debe tener el flag is_staff=True",
        "3. Las fechas se manejan en formato ISO 8601",
        "4. Los IDs de pacientes externos deben ser únicos por sistema de integración"
    ]
    
    for note in notes:
        story.append(Paragraph(note, styles['Normal']))
        story.append(Spacer(1, 6))
    
    # Construir el PDF
    doc.build(story)
    print(f"PDF generado exitosamente en: {pdf_file}")

if __name__ == "__main__":
    generate_api_documentation_pdf() 