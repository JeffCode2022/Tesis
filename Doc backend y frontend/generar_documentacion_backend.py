#!/usr/bin/env python3
"""
Script para generar documentación completa del Backend en PDF
Autor: Sistema de Predicción Cardiovascular
Fecha: 2024
"""

import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np

# Configuración de matplotlib
plt.style.use('default')
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.linewidth'] = 2

def get_text_color(bg_color):
    dark_colors = ['blue', 'green', 'purple', 'gray', 'navy', 'darkgreen', 'darkblue', 'darkviolet']
    if bg_color in dark_colors:
        return 'white'
    return 'black'

def crear_diagrama_arquitectura_backend():
    """Crear diagrama de arquitectura del backend"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 9))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.set_title('Arquitectura del Backend - Sistema de Predicción Cardiovascular', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Capas principales
    layers = [
        ('API REST', 0.5, 7, 9, 0.8, 'lightblue'),
        ('Autenticación', 0.5, 5.8, 9, 1, 'lightgreen'),
        ('Microservicios', 0.5, 3.8, 9, 1.8, 'lightyellow'),
        ('Base de Datos', 0.5, 2.2, 9, 1.4, 'lightcoral'),
        ('ML Services', 0.5, 0.6, 9, 1.4, 'lightpink')
    ]
    
    for name, x, y, w, h, color in layers:
        layer = FancyBboxPatch((x, y), w, h, 
                              boxstyle="round,pad=0.1", 
                              facecolor=color, 
                              edgecolor='black', 
                              linewidth=2)
        ax.add_patch(layer)
        ax.text(x + 0.3, y + h/2, name, ha='left', va='center', 
                fontsize=11, fontweight='bold', color='black')
    
    # Componentes API REST
    api_components = [
        ('Django REST', 1.5, 7.3, 'orange'),
        ('URLs', 3, 7.3, 'orange'),
        ('Serializers', 4.5, 7.3, 'orange'),
        ('Views', 6, 7.3, 'orange'),
        ('Middleware', 7.5, 7.3, 'orange')
    ]
    
    for name, x, y, color in api_components:
        rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Componentes Autenticación
    auth_components = [
        ('JWT Tokens', 1.5, 6.2, 'green'),
        ('Permissions', 3, 6.2, 'green'),
        ('User Model', 4.5, 6.2, 'green'),
        ('Backends', 6, 6.2, 'green')
    ]
    
    for name, x, y, color in auth_components:
        rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Microservicios
    services = [
        ('Patients\nService', 1.2, 4.6, 'yellow'),
        ('Predictions\nService', 2.8, 4.6, 'yellow'),
        ('Analytics\nService', 4.4, 4.6, 'yellow'),
        ('Medical Data\nService', 6, 4.6, 'yellow'),
        ('Integration\nService', 7.6, 4.6, 'yellow')
    ]
    
    for name, x, y, color in services:
        rect = FancyBboxPatch((x-0.5, y-0.25), 1.0, 0.5, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=7, fontweight='bold', color='black')
    
    # Base de Datos
    db_components = [
        ('SQLite\n(Development)', 1.5, 2.8, 'red'),
        ('PostgreSQL\n(Production)', 4.5, 2.8, 'red'),
        ('Redis\n(Cache)', 7.5, 2.8, 'red')
    ]
    
    for name, x, y, color in db_components:
        rect = FancyBboxPatch((x-0.6, y-0.2), 1.2, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=7, fontweight='bold', color='white')
    
    # ML Services
    ml_components = [
        ('Model\nTraining', 1.5, 1.2, 'purple'),
        ('Inference\nEngine', 4.5, 1.2, 'purple'),
        ('Model\nRegistry', 7.5, 1.2, 'purple')
    ]
    
    for name, x, y, color in ml_components:
        rect = FancyBboxPatch((x-0.5, y-0.2), 1.0, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=7, fontweight='bold', color='white')
    
    # Conexiones
    connections = [
        (1.5, 7.15, 1.5, 7), (3, 7.15, 3, 7), (4.5, 7.15, 4.5, 7), (6, 7.15, 6, 7), (7.5, 7.15, 7.5, 7),
        (1.5, 6.8, 1.5, 6.35), (3, 6.8, 3, 6.35), (4.5, 6.8, 4.5, 6.35), (6, 6.8, 6, 6.35),
        (1.2, 5.6, 1.5, 5.1), (2.8, 5.6, 2.8, 5.1), (4.4, 5.6, 4.4, 5.1), (6, 5.6, 6, 5.1), (7.6, 5.6, 7.6, 5.1),
        (1.2, 4.35, 1.5, 3), (2.8, 4.35, 4.5, 3), (6, 4.35, 7.5, 3),
        (1.5, 2.6, 1.5, 1.4), (4.5, 2.6, 4.5, 1.4), (7.5, 2.6, 7.5, 1.4)
    ]
    
    for x1, y1, x2, y2 in connections:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=15, fc="black", ec="black", linewidth=1.5)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('backend_arquitectura.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    return 'backend_arquitectura.png'

def crear_diagrama_flujo_backend():
    """Crear diagrama de flujo del backend"""
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 6)
    ax.set_title('Flujo de Procesamiento del Backend', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Elementos del flujo
    elements = [
        ('start', 1, 5.5, 'Request\nFrontend', 'green'),
        ('task', 2.5, 5.5, 'Middleware\nAuth', 'orange'),
        ('task', 4, 5.5, 'URL\nRouting', 'orange'),
        ('task', 5.5, 5.5, 'View\nProcessing', 'orange'),
        ('end', 7, 5.5, 'Response', 'red'),
        
        ('task', 1.5, 4, 'JWT\nValidation', 'blue'),
        ('task', 3, 4, 'Permissions\nCheck', 'blue'),
        ('task', 4.5, 4, 'Business\nLogic', 'blue'),
        ('task', 6, 4, 'Database\nOperations', 'blue'),
        
        ('data', 1, 2.5, 'User\nDatabase', 'purple'),
        ('data', 2.5, 2.5, 'Patient\nDatabase', 'purple'),
        ('data', 4, 2.5, 'Prediction\nDatabase', 'purple'),
        ('data', 5.5, 2.5, 'Medical\nData', 'purple'),
        
        ('task', 2, 1, 'ML\nModel', 'cyan'),
        ('task', 4, 1, 'Data\nProcessing', 'cyan'),
        ('task', 6, 1, 'Result\nGeneration', 'cyan')
    ]
    
    for elem_type, x, y, text, color in elements:
        text_color = get_text_color(color)
        if elem_type == 'start':
            circle = patches.Circle((x, y), 0.3, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'end':
            circle = patches.Circle((x, y), 0.3, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'task':
            rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'data':
            rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=7, fontweight='bold', color=text_color)
    
    # Flujos
    flows = [
        (1, 5.5, 2.5, 5.5), (2.5, 5.5, 4, 5.5), (4, 5.5, 5.5, 5.5), (5.5, 5.5, 7, 5.5),
        (2.5, 5.5, 1.5, 4), (4, 5.5, 3, 4), (5.5, 5.5, 4.5, 4), (6, 4, 7, 5.5),
        (1.5, 4, 1, 2.5), (3, 4, 2.5, 2.5), (4.5, 4, 4, 2.5), (6, 4, 5.5, 2.5),
        (4.5, 4, 2, 1), (2, 1, 4, 1), (4, 1, 6, 1), (6, 1, 6, 4)
    ]
    
    for x1, y1, x2, y2 in flows:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=15, fc="black", ec="black", linewidth=1.5)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('backend_flujo.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    return 'backend_flujo.png'

def generar_documentacion_backend():
    """Generar documentación completa del backend en PDF"""
    
    # Crear diagramas
    print("🎨 Generando diagramas del backend...")
    arch_imagen = crear_diagrama_arquitectura_backend()
    flujo_imagen = crear_diagrama_flujo_backend()
    
    # Crear PDF
    doc = SimpleDocTemplate("Documentacion_Backend.pdf", pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.darkblue
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=8,
        spaceBefore=15,
        textColor=colors.darkgreen
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Courier',
        spaceAfter=6,
        leftIndent=20,
        rightIndent=20,
        backColor=colors.lightgrey
    )
    
    # Contenido del documento
    story = []
    
    # Portada
    story.append(Paragraph("DOCUMENTACIÓN TÉCNICA", title_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Sistema de Predicción Cardiovascular", title_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("BACKEND", title_style))
    story.append(Spacer(1, 40))
    story.append(Paragraph("Versión: 1.0", normal_style))
    story.append(Paragraph("Fecha: 2024", normal_style))
    story.append(Paragraph("Autor: Equipo de Desarrollo", normal_style))
    story.append(PageBreak())
    
    # Índice
    story.append(Paragraph("ÍNDICE", heading_style))
    story.append(Spacer(1, 20))
    
    indice_items = [
        "1. INTRODUCCIÓN",
        "2. ARQUITECTURA DEL SISTEMA",
        "3. TECNOLOGÍAS UTILIZADAS",
        "4. ESTRUCTURA DEL PROYECTO",
        "5. CONFIGURACIÓN Y INSTALACIÓN",
        "6. API REST",
        "7. AUTENTICACIÓN Y AUTORIZACIÓN",
        "8. BASE DE DATOS",
        "9. SERVICIOS DE MACHINE LEARNING",
        "10. MICROSERVICIOS",
        "11. FLUJO DE PROCESAMIENTO",
        "12. DESPLIEGUE",
        "13. MANTENIMIENTO Y MONITOREO"
    ]
    
    for item in indice_items:
        story.append(Paragraph(item, normal_style))
    
    story.append(PageBreak())
    
    # 1. INTRODUCCIÓN
    story.append(Paragraph("1. INTRODUCCIÓN", heading_style))
    story.append(Paragraph("""
    El backend del Sistema de Predicción Cardiovascular es una aplicación robusta desarrollada en Django que proporciona 
    servicios REST para la gestión de pacientes, predicciones cardiovasculares y análisis de datos médicos. 
    Esta documentación describe la arquitectura, tecnologías, configuración y funcionamiento del sistema.
    """, normal_style))
    
    story.append(Paragraph("1.1 Objetivos del Sistema", subheading_style))
    story.append(Paragraph("""
    • Proporcionar una API REST segura y escalable para el frontend
    • Gestionar la autenticación y autorización de usuarios
    • Procesar datos médicos y generar predicciones cardiovasculares
    • Almacenar y gestionar información de pacientes de forma segura
    • Integrar modelos de machine learning para análisis predictivo
    • Proporcionar servicios de analytics y reportes
    """, normal_style))
    
    story.append(PageBreak())
    
    # 1. ARQUITECTURA GENERAL
    story.append(Paragraph("1. ARQUITECTURA GENERAL", heading_style))
    story.append(Paragraph("1.1 Visión General del Sistema", subheading_style))
    story.append(Paragraph("El backend del Sistema de Predicción Cardiovascular sigue una arquitectura de microservicios, con capas bien definidas para API REST, autenticación, servicios de ML, base de datos y analytics. Permite escalabilidad, mantenibilidad y alta disponibilidad.", normal_style))

    story.append(Paragraph("1.2 Componentes Principales", subheading_style))
    story.append(Paragraph("• API REST\n• Autenticación y Autorización\n• Microservicios\n• Base de Datos\n• Servicios de Machine Learning\n• Analytics y Reportes", normal_style))

    if os.path.exists(arch_imagen):
        img = Image(arch_imagen, width=7*inch, height=5*inch)
        story.append(img)
        story.append(Spacer(1, 10))

    story.append(PageBreak())

    # 2. TECNOLOGÍAS Y FRAMEWORKS
    story.append(Paragraph("2. TECNOLOGÍAS Y FRAMEWORKS", heading_style))
    # ... (desarrollar subcapítulos para Django REST, PostgreSQL, Redis, Celery, etc.)

    # 3. MODELO DE DATOS
    story.append(Paragraph("3. MODELO DE DATOS", heading_style))
    # ... (incluir esquema, modelos, relaciones, constraints, tablas y diagramas)

    # 4. API REST
    story.append(Paragraph("4. API REST", heading_style))
    # ... (arquitectura, endpoints, serialización, validación, manejo de errores)

    # 5. MOTOR DE MACHINE LEARNING
    story.append(Paragraph("5. MOTOR DE MACHINE LEARNING", heading_style))
    # ... (implementación, comparativa, pipeline, métricas)

    # 6. INTEGRACIÓN Y DEPLOYMENT
    story.append(Paragraph("6. INTEGRACIÓN Y DEPLOYMENT", heading_style))
    # ... (Docker, variables de entorno, monitoreo, logging)

    # 7. SEGURIDAD Y PERFORMANCE
    story.append(Paragraph("7. SEGURIDAD Y PERFORMANCE", heading_style))
    # ... (medidas de seguridad, optimización, escalabilidad)

    # 8. CÓDIGO FUENTE RELEVANTE
    story.append(Paragraph("8. CÓDIGO FUENTE RELEVANTE", heading_style))
    # ... (modelos, views, serializers, ML engine, fragmentos de código)

    # Estructura del proyecto (mejorada)
    estructura_arbol = [
        ["backend/", "Raíz del backend"],
        ["├── apps/", "Aplicaciones principales"],
        ["│   ├── authentication/", "Autenticación y usuarios"],
        ["│   ├── patients/", "Gestión de pacientes"],
        ["│   ├── predictions/", "Predicciones ML"],
        ["│   ├── analytics/", "Análisis y reportes"],
        ["│   ├── medical_data/", "Datos médicos"],
        ["│   └── integration/", "Integraciones externas"],
        ["├── ml_models/", "Modelos de ML"],
        ["├── config/", "Configuraciones"],
        ["├── requirements.txt", "Dependencias"],
        ["└── manage.py", "Script de gestión"]
    ]
    tabla_estructura = Table(estructura_arbol, colWidths=[2.5*inch, 4.5*inch])
    tabla_estructura.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_estructura)
    
    story.append(PageBreak())
    
    # 5. CONFIGURACIÓN Y INSTALACIÓN
    story.append(Paragraph("5. CONFIGURACIÓN Y INSTALACIÓN", heading_style))
    
    story.append(Paragraph("5.1 Requisitos del Sistema", subheading_style))
    story.append(Paragraph("""
    • Python 3.8 o superior
    • pip (gestor de paquetes de Python)
    • Git
    • PostgreSQL (para producción)
    • Redis (opcional, para caché)
    """, normal_style))
    
    story.append(Paragraph("5.2 Instalación Paso a Paso", subheading_style))
    
    pasos_instalacion = [
        ["Paso", "Comando", "Descripción"],
        ["1", "git clone <repo>", "Clonar el repositorio"],
        ["2", "cd backend", "Entrar al directorio del backend"],
        ["3", "python -m venv env", "Crear entorno virtual"],
        ["4", "source env/bin/activate", "Activar entorno virtual (Linux/Mac)"],
        ["4", "env\\Scripts\\activate", "Activar entorno virtual (Windows)"],
        ["5", "pip install -r requirements.txt", "Instalar dependencias"],
        ["6", "python manage.py migrate", "Ejecutar migraciones"],
        ["7", "python manage.py createsuperuser", "Crear usuario administrador"],
        ["8", "python manage.py runserver", "Iniciar servidor de desarrollo"]
    ]
    
    tabla_instalacion = Table(pasos_instalacion, colWidths=[0.5*inch, 2*inch, 4*inch])
    tabla_instalacion.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_instalacion)
    
    story.append(PageBreak())
    
    # 6. API REST
    story.append(Paragraph("6. API REST", heading_style))
    
    story.append(Paragraph("6.1 Endpoints Principales", subheading_style))
    
    endpoints = [
        ["Método", "Endpoint", "Descripción"],
        ["POST", "/api/auth/login/", "Autenticación de usuario"],
        ["POST", "/api/auth/register/", "Registro de nuevo usuario"],
        ["GET", "/api/patients/", "Listar pacientes"],
        ["POST", "/api/patients/", "Crear paciente"],
        ["GET", "/api/patients/{id}/", "Obtener paciente específico"],
        ["PUT", "/api/patients/{id}/", "Actualizar paciente"],
        ["DELETE", "/api/patients/{id}/", "Eliminar paciente"],
        ["POST", "/api/predictions/", "Crear predicción"],
        ["GET", "/api/predictions/", "Listar predicciones"],
        ["GET", "/api/analytics/", "Obtener analytics"]
    ]
    
    tabla_endpoints = Table(endpoints, colWidths=[1*inch, 2.5*inch, 3*inch])
    tabla_endpoints.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_endpoints)
    
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("6.2 Ejemplo de Respuesta API", subheading_style))
    
    ejemplo_respuesta = """
{
    "id": 1,
    "patient": {
        "id": 123,
        "name": "Juan Pérez",
        "age": 45,
        "gender": "M"
    },
    "prediction": {
        "risk_score": 0.75,
        "risk_level": "HIGH",
        "confidence": 0.89
    },
    "created_at": "2024-01-15T10:30:00Z"
}
    """
    
    story.append(Paragraph(ejemplo_respuesta, code_style))
    
    story.append(PageBreak())
    
    # 7. AUTENTICACIÓN Y AUTORIZACIÓN
    story.append(Paragraph("7. AUTENTICACIÓN Y AUTORIZACIÓN", heading_style))
    
    story.append(Paragraph("7.1 JWT Authentication", subheading_style))
    story.append(Paragraph("""
    El sistema utiliza JSON Web Tokens (JWT) para autenticación stateless. Los tokens contienen información 
    del usuario y permisos, y se validan en cada petición.
    """, normal_style))
    
    story.append(Paragraph("7.2 Permisos y Roles", subheading_style))
    story.append(Paragraph("""
    • <b>Admin:</b> Acceso completo al sistema
    • <b>Doctor:</b> Gestión de pacientes y predicciones
    • <b>Nurse:</b> Lectura de datos y creación de registros básicos
    • <b>Analyst:</b> Acceso a analytics y reportes
    """, normal_style))
    
    story.append(PageBreak())
    
    # 8. BASE DE DATOS
    story.append(Paragraph("8. BASE DE DATOS", heading_style))
    
    story.append(Paragraph("8.1 Modelos Principales", subheading_style))
    
    modelos_db = [
        ["Modelo", "Campos Principales", "Relaciones"],
        ["User", "username, email, role", "OneToMany: Patient"],
        ["Patient", "name, age, gender, dni", "ManyToOne: User, OneToMany: MedicalRecord"],
        ["MedicalRecord", "diagnosis, treatment, date", "ManyToOne: Patient"],
        ["Prediction", "risk_score, confidence, model_used", "ManyToOne: Patient"],
        ["Analytics", "metrics, period, data", "ManyToOne: User"]
    ]
    
    tabla_modelos = Table(modelos_db, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    tabla_modelos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_modelos)
    
    story.append(PageBreak())
    
    # 9. SERVICIOS DE MACHINE LEARNING
    story.append(Paragraph("9. SERVICIOS DE MACHINE LEARNING", heading_style))
    
    story.append(Paragraph("9.1 Pipeline de ML", subheading_style))
    story.append(Paragraph("""
    El sistema incluye un pipeline completo de machine learning que incluye:
    • Preprocesamiento de datos médicos
    • Entrenamiento de modelos predictivos
    • Validación y evaluación de modelos
    • Inferencia en tiempo real
    • Monitoreo de rendimiento
    """, normal_style))
    
    story.append(Paragraph("9.2 Modelos Implementados", subheading_style))
    story.append(Paragraph("""
    • <b>Random Forest:</b> Para predicción de riesgo cardiovascular
    • <b>Logistic Regression:</b> Para clasificación binaria de riesgo
    • <b>Gradient Boosting:</b> Para predicciones más precisas
    • <b>Neural Networks:</b> Para patrones complejos en datos médicos
    """, normal_style))
    
    story.append(PageBreak())
    
    # 10. MICROSERVICIOS
    story.append(Paragraph("10. MICROSERVICIOS", heading_style))
    
    story.append(Paragraph("10.1 Arquitectura de Microservicios", subheading_style))
    story.append(Paragraph("""
    El sistema está diseñado como una arquitectura de microservicios donde cada servicio tiene 
    responsabilidades específicas y puede ser desplegado independientemente.
    """, normal_style))
    
    servicios_desc = [
        ["Servicio", "Responsabilidad", "Tecnologías"],
        ["Patient Service", "Gestión de pacientes", "Django, PostgreSQL"],
        ["Prediction Service", "Predicciones ML", "Django, scikit-learn"],
        ["Analytics Service", "Reportes y analytics", "Django, pandas"],
        ["Auth Service", "Autenticación", "Django, JWT"],
        ["Integration Service", "APIs externas", "Django, requests"]
    ]
    
    tabla_servicios = Table(servicios_desc, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    tabla_servicios.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_servicios)
    
    story.append(PageBreak())
    
    # 11. FLUJO DE PROCESAMIENTO
    story.append(Paragraph("11. FLUJO DE PROCESAMIENTO", heading_style))
    story.append(Paragraph("""
    El flujo de procesamiento describe cómo las peticiones son manejadas desde que llegan al servidor 
    hasta que se genera la respuesta, incluyendo autenticación, validación, procesamiento de negocio 
    y generación de respuestas.
    """, normal_style))
    
    # Imagen de flujo
    if os.path.exists(flujo_imagen):
        img = Image(flujo_imagen, width=7*inch, height=5*inch)
        story.append(img)
        story.append(Spacer(1, 10))
    
    story.append(PageBreak())
    
    # 12. DESPLIEGUE
    story.append(Paragraph("12. DESPLIEGUE", heading_style))
    
    story.append(Paragraph("12.1 Configuración de Producción", subheading_style))
    story.append(Paragraph("""
    Para el despliegue en producción, se recomienda:
    • Usar PostgreSQL como base de datos principal
    • Configurar Redis para caché
    • Usar Gunicorn como servidor WSGI
    • Configurar Nginx como proxy reverso
    • Implementar HTTPS con certificados SSL
    • Configurar backups automáticos
    """, normal_style))
    
    story.append(Paragraph("12.2 Variables de Entorno", subheading_style))
    
    variables_env = """
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
    """
    
    story.append(Paragraph(variables_env, code_style))
    
    story.append(PageBreak())
    
    # 13. MANTENIMIENTO Y MONITOREO
    story.append(Paragraph("13. MANTENIMIENTO Y MONITOREO", heading_style))
    
    story.append(Paragraph("13.1 Tareas de Mantenimiento", subheading_style))
    story.append(Paragraph("""
    • Actualización regular de dependencias
    • Monitoreo de logs y errores
    • Backup de base de datos
    • Limpieza de datos temporales
    • Actualización de modelos ML
    • Monitoreo de rendimiento
    """, normal_style))
    
    story.append(Paragraph("13.2 Herramientas de Monitoreo", subheading_style))
    story.append(Paragraph("""
    • Django Debug Toolbar (desarrollo)
    • Sentry (monitoreo de errores)
    • Prometheus + Grafana (métricas)
    • ELK Stack (logs)
    • Health checks automáticos
    """, normal_style))
    
    # Generar PDF
    doc.build(story)
    print("✅ Documentación del Backend generada: Documentacion_Backend.pdf")

if __name__ == "__main__":
    generar_documentacion_backend() 