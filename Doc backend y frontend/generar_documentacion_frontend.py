#!/usr/bin/env python3
"""
Script para generar documentación completa del Frontend en PDF
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

def crear_diagrama_arquitectura_frontend():
    """Crear diagrama de arquitectura del frontend"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 9))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.set_title('Arquitectura del Frontend - Sistema de Predicción Cardiovascular', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Capas principales
    layers = [
        ('UI Components', 0.5, 7, 9, 0.8, 'lightblue'),
        ('Pages & Routing', 0.5, 5.8, 9, 1, 'lightgreen'),
        ('State Management', 0.5, 4.6, 9, 1, 'lightyellow'),
        ('Services & API', 0.5, 3.4, 9, 1, 'lightcoral'),
        ('Utils & Hooks', 0.5, 2.2, 9, 1, 'lightpink'),
        ('Styling & Theme', 0.5, 0.8, 9, 1.2, 'lightgray')
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
    
    # UI Components
    ui_components = [
        ('Header', 1.5, 7.3, 'blue'),
        ('Sidebar', 3, 7.3, 'blue'),
        ('Forms', 4.5, 7.3, 'blue'),
        ('Modals', 6, 7.3, 'blue'),
        ('Charts', 7.5, 7.3, 'blue')
    ]
    
    for name, x, y, color in ui_components:
        rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Pages & Routing
    pages = [
        ('Dashboard', 1.5, 6.2, 'green'),
        ('Patients', 3, 6.2, 'green'),
        ('Predictions', 4.5, 6.2, 'green'),
        ('Analytics', 6, 6.2, 'green'),
        ('Login', 7.5, 6.2, 'green')
    ]
    
    for name, x, y, color in pages:
        rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # State Management
    state_components = [
        ('Auth Context', 2.5, 5, 'yellow'),
        ('Patient State', 5, 5, 'yellow'),
        ('Prediction State', 7.5, 5, 'yellow')
    ]
    
    for name, x, y, color in state_components:
        rect = FancyBboxPatch((x-0.5, y-0.15), 1.0, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='black')
    
    # Services & API
    services = [
        ('Auth Service', 1.5, 3.8, 'red'),
        ('Patient Service', 3, 3.8, 'red'),
        ('Prediction Service', 4.5, 3.8, 'red'),
        ('Analytics Service', 6, 3.8, 'red'),
        ('API Client', 7.5, 3.8, 'red')
    ]
    
    for name, x, y, color in services:
        rect = FancyBboxPatch((x-0.4, y-0.15), 0.8, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=7, fontweight='bold', color='white')
    
    # Utils & Hooks
    utils = [
        ('useAuth', 1.5, 2.6, 'purple'),
        ('useToast', 3, 2.6, 'purple'),
        ('utils.ts', 4.5, 2.6, 'purple'),
        ('cache.ts', 6, 2.6, 'purple'),
        ('rateLimit.ts', 7.5, 2.6, 'purple')
    ]
    
    for name, x, y, color in utils:
        rect = FancyBboxPatch((x-0.3, y-0.15), 0.6, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=7, fontweight='bold', color='white')
    
    # Styling & Theme
    styling = [
        ('Tailwind CSS', 2.5, 1.3, 'gray'),
        ('shadcn/ui', 5, 1.3, 'gray'),
        ('Theme Provider', 7.5, 1.3, 'gray')
    ]
    
    for name, x, y, color in styling:
        rect = FancyBboxPatch((x-0.5, y-0.15), 1.0, 0.3, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Conexiones
    connections = [
        (1.5, 7.15, 1.5, 7), (3, 7.15, 3, 7), (4.5, 7.15, 4.5, 7), (6, 7.15, 6, 7), (7.5, 7.15, 7.5, 7),
        (1.5, 6.8, 1.5, 6.35), (3, 6.8, 3, 6.35), (4.5, 6.8, 4.5, 6.35), (6, 6.8, 6, 6.35), (7.5, 6.8, 7.5, 6.35),
        (2.5, 5.8, 2.5, 5.15), (5, 5.8, 5, 5.15), (7.5, 5.8, 7.5, 5.15),
        (2.5, 4.8, 1.5, 3.95), (5, 4.8, 3, 3.95), (7.5, 4.8, 7.5, 3.95),
        (1.5, 3.65, 1.5, 2.75), (3, 3.65, 3, 2.75), (4.5, 3.65, 4.5, 2.75), (6, 3.65, 6, 2.75), (7.5, 3.65, 7.5, 2.75),
        (2.5, 2.45, 2.5, 1.45), (5, 2.45, 5, 1.45), (7.5, 2.45, 7.5, 1.45)
    ]
    
    for x1, y1, x2, y2 in connections:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=15, fc="black", ec="black", linewidth=1.5)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('frontend_arquitectura.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    return 'frontend_arquitectura.png'

def crear_diagrama_flujo_frontend():
    """Crear diagrama de flujo del frontend"""
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 6)
    ax.set_title('Flujo de Interacción del Frontend', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Elementos del flujo
    elements = [
        ('start', 1, 5.5, 'User\nLogin', 'green'),
        ('task', 2.5, 5.5, 'Auth\nContext', 'orange'),
        ('task', 4, 5.5, 'Dashboard\nLoad', 'orange'),
        ('task', 5.5, 5.5, 'API\nCall', 'orange'),
        ('end', 7, 5.5, 'UI\nRender', 'red'),
        
        ('task', 1.5, 4, 'JWT\nStorage', 'blue'),
        ('task', 3, 4, 'Route\nProtection', 'blue'),
        ('task', 4.5, 4, 'Data\nFetching', 'blue'),
        ('task', 6, 4, 'Component\nUpdate', 'blue'),
        
        ('data', 1, 2.5, 'Local\nStorage', 'purple'),
        ('data', 2.5, 2.5, 'React\nState', 'purple'),
        ('data', 4, 2.5, 'API\nResponse', 'purple'),
        ('data', 5.5, 2.5, 'Component\nProps', 'purple'),
        
        ('task', 2, 1, 'Form\nValidation', 'cyan'),
        ('task', 4, 1, 'Error\nHandling', 'cyan'),
        ('task', 6, 1, 'Loading\nStates', 'cyan')
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
    plt.savefig('frontend_flujo.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    return 'frontend_flujo.png'

def generar_documentacion_frontend():
    """Generar documentación completa del frontend en PDF"""
    
    # Crear diagramas
    print("🎨 Generando diagramas del frontend...")
    arch_imagen = crear_diagrama_arquitectura_frontend()
    flujo_imagen = crear_diagrama_flujo_frontend()
    
    # Crear PDF
    doc = SimpleDocTemplate("Documentacion_Frontend.pdf", pagesize=A4)
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
    story.append(Paragraph("FRONTEND", title_style))
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
        "2. ARQUITECTURA DEL FRONTEND",
        "3. TECNOLOGÍAS UTILIZADAS",
        "4. ESTRUCTURA DEL PROYECTO",
        "5. CONFIGURACIÓN Y INSTALACIÓN",
        "6. COMPONENTES UI",
        "7. ROUTING Y NAVEGACIÓN",
        "8. GESTIÓN DE ESTADO",
        "9. SERVICIOS Y API",
        "10. HOOKS Y UTILIDADES",
        "11. ESTILOS Y TEMAS",
        "12. FLUJO DE INTERACCIÓN",
        "13. DESPLIEGUE",
        "14. OPTIMIZACIÓN Y RENDIMIENTO"
    ]
    
    for item in indice_items:
        story.append(Paragraph(item, normal_style))
    
    story.append(PageBreak())
    
    # 1. INTRODUCCIÓN
    story.append(Paragraph("1. INTRODUCCIÓN", heading_style))
    story.append(Paragraph("""
    El frontend del Sistema de Predicción Cardiovascular es una aplicación web moderna desarrollada en Next.js 
    que proporciona una interfaz de usuario intuitiva y responsiva para la gestión de pacientes, 
    visualización de predicciones cardiovasculares y análisis de datos médicos.
    """, normal_style))
    
    story.append(Paragraph("1.1 Objetivos del Frontend", subheading_style))
    story.append(Paragraph("""
    • Proporcionar una interfaz de usuario moderna y responsiva
    • Facilitar la gestión eficiente de pacientes y datos médicos
    • Visualizar predicciones cardiovasculares de forma clara
    • Generar reportes y analytics interactivos
    • Garantizar una experiencia de usuario excepcional
    • Implementar autenticación segura y gestión de sesiones
    """, normal_style))
    
    story.append(PageBreak())
    
    # 1. ARQUITECTURA GENERAL
    story.append(Paragraph("1. ARQUITECTURA GENERAL", heading_style))
    story.append(Paragraph("1.1 Visión General del Sistema", subheading_style))
    story.append(Paragraph("El frontend del Sistema de Predicción Cardiovascular es una SPA moderna desarrollada en Next.js 14, con arquitectura de componentes, gestión de estado y servicios API centralizados.", normal_style))

    story.append(Paragraph("1.2 Componentes Principales", subheading_style))
    story.append(Paragraph("• App Router\n• Componentes UI\n• Servicios y API\n• Hooks personalizados\n• Gestión de estado\n• Temas y estilos", normal_style))

    if os.path.exists(arch_imagen):
        img = Image(arch_imagen, width=7*inch, height=5*inch)
        story.append(img)
        story.append(Spacer(1, 10))

    story.append(PageBreak())

    # 2. TECNOLOGÍAS Y FRAMEWORKS
    story.append(Paragraph("2. TECNOLOGÍAS Y FRAMEWORKS", heading_style))
    # ... (desarrollar subcapítulos para Next.js, React, Tailwind, Zustand, etc.)

    # 3. MODELO DE DATOS (adaptado a frontend)
    story.append(Paragraph("3. MODELO DE DATOS", heading_style))
    # ... (incluir estructura de props, tipos TypeScript, validaciones, tablas y diagramas)

    # 4. API REST (consumo desde frontend)
    story.append(Paragraph("4. API REST", heading_style))
    # ... (arquitectura de consumo, endpoints, validación, manejo de errores)

    # 5. MOTOR DE MACHINE LEARNING (consumo de predicciones)
    story.append(Paragraph("5. MOTOR DE MACHINE LEARNING", heading_style))
    # ... (cómo se consumen los resultados ML, visualización, métricas)

    # 6. INTEGRACIÓN Y DEPLOYMENT
    story.append(Paragraph("6. INTEGRACIÓN Y DEPLOYMENT", heading_style))
    # ... (Docker, variables de entorno, monitoreo, logging)

    # 7. SEGURIDAD Y PERFORMANCE
    story.append(Paragraph("7. SEGURIDAD Y PERFORMANCE", heading_style))
    # ... (medidas de seguridad, optimización, escalabilidad)

    # 8. CÓDIGO FUENTE RELEVANTE
    story.append(Paragraph("8. CÓDIGO FUENTE RELEVANTE", heading_style))
    # ... (componentes principales, hooks, servicios, fragmentos de código)

    # Estructura del proyecto (mejorada)
    estructura_arbol = [
        ["frontend/", "Raíz del frontend"],
        ["├── app/", "App Router (Next.js 14)"],
        ["│   ├── dashboard/", "Página del dashboard"],
        ["│   ├── patients/", "Página de pacientes"],
        ["│   ├── login/", "Página de login"],
        ["│   └── layout.tsx", "Layout principal"],
        ["├── components/", "Componentes reutilizables"],
        ["│   ├── ui/", "Componentes base (shadcn/ui)"],
        ["│   ├── header/", "Componente header"],
        ["│   ├── sidebar/", "Componente sidebar"],
        ["│   └── forms/", "Formularios"],
        ["├── lib/", "Utilidades y configuraciones"],
        ["│   ├── api.ts", "Cliente API"],
        ["│   ├── auth.ts", "Autenticación"],
        ["│   └── utils.ts", "Utilidades generales"],
        ["├── hooks/", "Custom hooks"],
        ["├── types/", "Definiciones TypeScript"],
        ["└── public/", "Archivos estáticos"]
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
    • Node.js 18+ o superior
    • npm, yarn o pnpm
    • Git
    • Editor de código (VS Code recomendado)
    """, normal_style))
    
    story.append(Paragraph("5.2 Instalación Paso a Paso", subheading_style))
    
    pasos_instalacion = [
        ["Paso", "Comando", "Descripción"],
        ["1", "git clone <repo>", "Clonar el repositorio"],
        ["2", "cd frontend", "Entrar al directorio del frontend"],
        ["3", "npm install", "Instalar dependencias"],
        ["4", "cp .env.example .env.local", "Configurar variables de entorno"],
        ["5", "npm run dev", "Iniciar servidor de desarrollo"],
        ["6", "npm run build", "Construir para producción"],
        ["7", "npm start", "Iniciar servidor de producción"]
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
    
    # 6. COMPONENTES UI
    story.append(Paragraph("6. COMPONENTES UI", heading_style))
    
    story.append(Paragraph("6.1 Componentes Principales", subheading_style))
    
    componentes = [
        ["Componente", "Propósito", "Tecnologías"],
        ["Header", "Navegación principal y perfil", "Next.js, Tailwind"],
        ["Sidebar", "Menú lateral y navegación", "Next.js, Lucide Icons"],
        ["PatientForm", "Formulario de pacientes", "React Hook Form, Zod"],
        ["PredictionChart", "Gráficos de predicciones", "Recharts, D3.js"],
        ["DataTable", "Tabla de datos", "TanStack Table"],
        ["Modal", "Ventanas modales", "Radix UI"],
        ["Toast", "Notificaciones", "Sonner"]
    ]
    
    tabla_componentes = Table(componentes, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    tabla_componentes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_componentes)
    
    story.append(PageBreak())
    
    # 7. ROUTING Y NAVEGACIÓN
    story.append(Paragraph("7. ROUTING Y NAVEGACIÓN", heading_style))
    
    story.append(Paragraph("7.1 App Router (Next.js 14)", subheading_style))
    story.append(Paragraph("""
    El proyecto utiliza el nuevo App Router de Next.js 14 que proporciona:
    • Routing basado en archivos
    • Layouts anidados
    • Server Components por defecto
    • Streaming y Suspense
    • Optimizaciones automáticas
    """, normal_style))
    
    story.append(Paragraph("7.2 Estructura de Rutas", subheading_style))
    
    rutas = [
        ["Ruta", "Página", "Descripción"],
        ["/", "Home", "Página principal"],
        ["/login", "Login", "Autenticación"],
        ["/dashboard", "Dashboard", "Panel principal"],
        ["/patients", "Patients", "Gestión de pacientes"],
        ["/predictions", "Predictions", "Predicciones"],
        ["/analytics", "Analytics", "Reportes y análisis"]
    ]
    
    tabla_rutas = Table(rutas, colWidths=[1.5*inch, 1.5*inch, 3.5*inch])
    tabla_rutas.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(tabla_rutas)
    
    story.append(PageBreak())
    
    # 8. GESTIÓN DE ESTADO
    story.append(Paragraph("8. GESTIÓN DE ESTADO", heading_style))
    
    story.append(Paragraph("8.1 Context API", subheading_style))
    story.append(Paragraph("""
    Se utiliza React Context para gestionar el estado global de la aplicación:
    • AuthContext: Maneja autenticación y sesión del usuario
    • ThemeContext: Gestiona el tema claro/oscuro
    • PatientContext: Estado de pacientes y filtros
    """, normal_style))
    
    story.append(Paragraph("8.2 Custom Hooks", subheading_style))
    story.append(Paragraph("""
    • useAuth: Hook personalizado para autenticación
    • usePatients: Hook para gestión de pacientes
    • usePredictions: Hook para predicciones
    • useToast: Hook para notificaciones
    """, normal_style))
    
    story.append(PageBreak())
    
    # 9. SERVICIOS Y API
    story.append(Paragraph("9. SERVICIOS Y API", heading_style))
    
    story.append(Paragraph("9.1 Cliente API", subheading_style))
    story.append(Paragraph("""
    Se utiliza un cliente API centralizado que maneja:
    • Interceptores para tokens JWT
    • Manejo de errores global
    • Rate limiting
    • Retry automático
    • Cache de respuestas
    """, normal_style))
    
    story.append(Paragraph("9.2 Servicios Especializados", subheading_style))
    
    servicios = [
        ["Servicio", "Endpoint Base", "Funcionalidad"],
        ["AuthService", "/api/auth", "Login, registro, logout"],
        ["PatientService", "/api/patients", "CRUD de pacientes"],
        ["PredictionService", "/api/predictions", "Predicciones ML"],
        ["AnalyticsService", "/api/analytics", "Reportes y métricas"]
    ]
    
    tabla_servicios = Table(servicios, colWidths=[1.5*inch, 1.5*inch, 3.5*inch])
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
    
    # 10. HOOKS Y UTILIDADES
    story.append(Paragraph("10. HOOKS Y UTILIDADES", heading_style))
    
    story.append(Paragraph("10.1 Custom Hooks", subheading_style))
    story.append(Paragraph("""
    • useAuth: Gestión de autenticación y sesión
    • usePatients: CRUD de pacientes con cache
    • usePredictions: Predicciones con loading states
    • useToast: Sistema de notificaciones
    • useMobile: Detección de dispositivos móviles
    """, normal_style))
    
    story.append(Paragraph("10.2 Utilidades", subheading_style))
    story.append(Paragraph("""
    • utils.ts: Funciones de utilidad general
    • cache.ts: Sistema de cache en memoria
    • rateLimit.ts: Control de rate limiting
    • retry.ts: Lógica de reintentos
    • validation.ts: Validaciones de formularios
    """, normal_style))
    
    story.append(PageBreak())
    
    # 11. ESTILOS Y TEMAS
    story.append(Paragraph("11. ESTILOS Y TEMAS", heading_style))
    
    story.append(Paragraph("11.1 Tailwind CSS", subheading_style))
    story.append(Paragraph("""
    • Configuración personalizada en tailwind.config.ts
    • Variables CSS para colores y espaciado
    • Componentes reutilizables con @apply
    • Responsive design con breakpoints
    • Dark mode automático
    """, normal_style))
    
    story.append(Paragraph("11.2 shadcn/ui", subheading_style))
    story.append(Paragraph("""
    • Componentes base accesibles
    • Tema consistente y personalizable
    • Integración con Radix UI
    • Soporte para dark mode
    • Componentes: Button, Input, Card, Dialog, etc.
    """, normal_style))
    
    story.append(PageBreak())
    
    # 12. FLUJO DE INTERACCIÓN
    story.append(Paragraph("12. FLUJO DE INTERACCIÓN", heading_style))
    story.append(Paragraph("""
    El flujo de interacción describe cómo los usuarios navegan por la aplicación, 
    cómo se gestiona el estado y cómo se comunican los componentes.
    """, normal_style))
    
    # Imagen de flujo
    if os.path.exists(flujo_imagen):
        img = Image(flujo_imagen, width=7*inch, height=5*inch)
        story.append(img)
        story.append(Spacer(1, 10))
    
    story.append(PageBreak())
    
    # 13. DESPLIEGUE
    story.append(Paragraph("13. DESPLIEGUE", heading_style))
    
    story.append(Paragraph("13.1 Configuración de Producción", subheading_style))
    story.append(Paragraph("""
    • Build optimizado con Next.js
    • Variables de entorno para producción
    • CDN para assets estáticos
    • Compresión y minificación
    • Cache headers apropiados
    • SSL/HTTPS obligatorio
    """, normal_style))
    
    story.append(Paragraph("13.2 Variables de Entorno", subheading_style))
    
    variables_env = """
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com
    """
    
    story.append(Paragraph(variables_env, code_style))
    
    story.append(PageBreak())
    
    # 14. OPTIMIZACIÓN Y RENDIMIENTO
    story.append(Paragraph("14. OPTIMIZACIÓN Y RENDIMIENTO", heading_style))
    
    story.append(Paragraph("14.1 Optimizaciones Implementadas", subheading_style))
    story.append(Paragraph("""
    • Lazy loading de componentes
    • Code splitting automático
    • Optimización de imágenes con Next.js Image
    • Bundle analyzer para monitoreo
    • Tree shaking para reducir bundle size
    • Service Worker para cache offline
    """, normal_style))
    
    story.append(Paragraph("14.2 Métricas de Rendimiento", subheading_style))
    story.append(Paragraph("""
    • First Contentful Paint (FCP) < 1.5s
    • Largest Contentful Paint (LCP) < 2.5s
    • Cumulative Layout Shift (CLS) < 0.1
    • First Input Delay (FID) < 100ms
    • Time to Interactive (TTI) < 3.5s
    """, normal_style))
    
    # Generar PDF
    doc.build(story)
    print("✅ Documentación del Frontend generada: Documentacion_Frontend.pdf")

if __name__ == "__main__":
    generar_documentacion_frontend() 