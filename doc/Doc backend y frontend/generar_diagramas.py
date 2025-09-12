#!/usr/bin/env python3
"""
Script para generar diagramas de arquitectura y flujos del Sistema de Predicción Cardiovascular
Autor: Sistema de Predicción Cardiovascular
Fecha: 2024
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
import matplotlib.patches as mpatches

# Configuración de estilo
plt.style.use('default')
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.linewidth'] = 2

def get_text_color(bg_color):
    dark_colors = ['blue', 'green', 'purple', 'gray', 'navy', 'darkgreen', 'darkblue', 'darkviolet']
    if bg_color in dark_colors:
        return 'white'
    return 'black'

def diagrama_arquitectura_backend():
    """Diagrama de arquitectura del Backend"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.set_title('Arquitectura del Backend - Sistema de Predicción Cardiovascular', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Capas principales
    layers = [
        ('API REST', 0.5, 8.5, 11, 1, 'lightblue'),
        ('Autenticación', 0.5, 7, 11, 1.2, 'lightgreen'),
        ('Microservicios', 0.5, 4.5, 11, 2, 'lightyellow'),
        ('Base de Datos', 0.5, 2.5, 11, 1.5, 'lightcoral'),
        ('ML Services', 0.5, 0.5, 11, 1.5, 'lightpink')
    ]
    
    for name, x, y, w, h, color in layers:
        layer = FancyBboxPatch((x, y), w, h, 
                              boxstyle="round,pad=0.1", 
                              facecolor=color, 
                              edgecolor='black', 
                              linewidth=2)
        ax.add_patch(layer)
        ax.text(x + 0.5, y + h/2, name, ha='left', va='center', 
                fontsize=12, fontweight='bold', color='black')
    
    # Componentes API REST
    api_components = [
        ('Django REST', 2, 8.8, 'orange'),
        ('URLs', 4, 8.8, 'orange'),
        ('Serializers', 6, 8.8, 'orange'),
        ('Views', 8, 8.8, 'orange'),
        ('Middleware', 10, 8.8, 'orange')
    ]
    
    for name, x, y, color in api_components:
        rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # Componentes Autenticación
    auth_components = [
        ('JWT Tokens', 2, 7.4, 'green'),
        ('Permissions', 4, 7.4, 'green'),
        ('User Model', 6, 7.4, 'green'),
        ('Backends', 8, 7.4, 'green')
    ]
    
    for name, x, y, color in auth_components:
        rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # Microservicios
    services = [
        ('Patients\nService', 1.5, 5.5, 'yellow'),
        ('Predictions\nService', 3.5, 5.5, 'yellow'),
        ('Analytics\nService', 5.5, 5.5, 'yellow'),
        ('Medical Data\nService', 7.5, 5.5, 'yellow'),
        ('Integration\nService', 9.5, 5.5, 'yellow')
    ]
    
    for name, x, y, color in services:
        rect = FancyBboxPatch((x-0.6, y-0.3), 1.2, 0.6, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='black')
    
    # Base de Datos
    db_components = [
        ('SQLite\n(Development)', 2, 3.2, 'red'),
        ('PostgreSQL\n(Production)', 5, 3.2, 'red'),
        ('Redis\n(Cache)', 8, 3.2, 'red')
    ]
    
    for name, x, y, color in db_components:
        rect = FancyBboxPatch((x-0.8, y-0.25), 1.6, 0.5, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # ML Services
    ml_components = [
        ('Model\nTraining', 2, 1.2, 'purple'),
        ('Inference\nEngine', 5, 1.2, 'purple'),
        ('Model\nRegistry', 8, 1.2, 'purple')
    ]
    
    for name, x, y, color in ml_components:
        rect = FancyBboxPatch((x-0.6, y-0.25), 1.2, 0.5, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Conexiones
    connections = [
        (2, 8.6, 2, 8.2), (4, 8.6, 4, 8.2), (6, 8.6, 6, 8.2), (8, 8.6, 8, 8.2),
        (2, 7.8, 2, 7.4), (4, 7.8, 4, 7.4), (6, 7.8, 6, 7.4), (8, 7.8, 8, 7.4),
        (1.5, 6.8, 1.5, 6.2), (3.5, 6.8, 3.5, 6.2), (5.5, 6.8, 5.5, 6.2),
        (7.5, 6.8, 7.5, 6.2), (9.5, 6.8, 9.5, 6.2),
        (1.5, 5.2, 2, 3.7), (3.5, 5.2, 5, 3.7), (5.5, 5.2, 8, 3.7),
        (2, 2.8, 2, 1.7), (5, 2.8, 5, 1.7), (8, 2.8, 8, 1.7)
    ]
    
    for x1, y1, x2, y2 in connections:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=20, fc="black", ec="black", linewidth=2)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('backend_arquitectura.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('backend_arquitectura.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Diagrama de arquitectura del Backend generado")

def diagrama_arquitectura_frontend():
    """Diagrama de arquitectura del Frontend"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.set_title('Arquitectura del Frontend - Sistema de Predicción Cardiovascular', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Capas principales
    layers = [
        ('UI Components', 0.5, 8.5, 11, 1, 'lightblue'),
        ('Pages & Routing', 0.5, 7, 11, 1.2, 'lightgreen'),
        ('State Management', 0.5, 5.5, 11, 1, 'lightyellow'),
        ('Services & API', 0.5, 4, 11, 1, 'lightcoral'),
        ('Utils & Hooks', 0.5, 2.5, 11, 1, 'lightpink'),
        ('Styling & Theme', 0.5, 1, 11, 1, 'lightgray')
    ]
    
    for name, x, y, w, h, color in layers:
        layer = FancyBboxPatch((x, y), w, h, 
                              boxstyle="round,pad=0.1", 
                              facecolor=color, 
                              edgecolor='black', 
                              linewidth=2)
        ax.add_patch(layer)
        ax.text(x + 0.5, y + h/2, name, ha='left', va='center', 
                fontsize=12, fontweight='bold', color='black')
    
    # UI Components
    ui_components = [
        ('Header', 2, 8.8, 'blue'),
        ('Sidebar', 4, 8.8, 'blue'),
        ('Forms', 6, 8.8, 'blue'),
        ('Modals', 8, 8.8, 'blue'),
        ('Charts', 10, 8.8, 'blue')
    ]
    
    for name, x, y, color in ui_components:
        rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # Pages & Routing
    pages = [
        ('Dashboard', 2, 7.4, 'green'),
        ('Patients', 4, 7.4, 'green'),
        ('Predictions', 6, 7.4, 'green'),
        ('Analytics', 8, 7.4, 'green'),
        ('Login', 10, 7.4, 'green')
    ]
    
    for name, x, y, color in pages:
        rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # State Management
    state_components = [
        ('Auth Context', 3, 6, 'yellow'),
        ('Patient State', 6, 6, 'yellow'),
        ('Prediction State', 9, 6, 'yellow')
    ]
    
    for name, x, y, color in state_components:
        rect = FancyBboxPatch((x-0.6, y-0.2), 1.2, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='black')
    
    # Services & API
    services = [
        ('Auth Service', 2, 4.4, 'red'),
        ('Patient Service', 4, 4.4, 'red'),
        ('Prediction Service', 6, 4.4, 'red'),
        ('Analytics Service', 8, 4.4, 'red'),
        ('API Client', 10, 4.4, 'red')
    ]
    
    for name, x, y, color in services:
        rect = FancyBboxPatch((x-0.5, y-0.2), 1.0, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Utils & Hooks
    utils = [
        ('useAuth', 2, 2.9, 'purple'),
        ('useToast', 4, 2.9, 'purple'),
        ('utils.ts', 6, 2.9, 'purple'),
        ('cache.ts', 8, 2.9, 'purple'),
        ('rateLimit.ts', 10, 2.9, 'purple')
    ]
    
    for name, x, y, color in utils:
        rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Styling & Theme
    styling = [
        ('Tailwind CSS', 3, 1.4, 'gray'),
        ('shadcn/ui', 6, 1.4, 'gray'),
        ('Theme Provider', 9, 1.4, 'gray')
    ]
    
    for name, x, y, color in styling:
        rect = FancyBboxPatch((x-0.6, y-0.2), 1.2, 0.4, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # Conexiones
    connections = [
        (2, 8.3, 2, 8.1), (4, 8.3, 4, 8.1), (6, 8.3, 6, 8.1), (8, 8.3, 8, 8.1), (10, 8.3, 10, 8.1),
        (2, 7.8, 2, 7.6), (4, 7.8, 4, 7.6), (6, 7.8, 6, 7.6), (8, 7.8, 8, 7.6), (10, 7.8, 10, 7.6),
        (3, 6.8, 3, 6.2), (6, 6.8, 6, 6.2), (9, 6.8, 9, 6.2),
        (3, 5.8, 2, 4.6), (6, 5.8, 6, 4.6), (9, 5.8, 10, 4.6),
        (2, 4.2, 2, 3.1), (4, 4.2, 4, 3.1), (6, 4.2, 6, 3.1), (8, 4.2, 8, 3.1), (10, 4.2, 10, 3.1),
        (2, 2.7, 3, 1.6), (6, 2.7, 6, 1.6), (10, 2.7, 9, 1.6)
    ]
    
    for x1, y1, x2, y2 in connections:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=20, fc="black", ec="black", linewidth=2)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('frontend_arquitectura.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('frontend_arquitectura.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Diagrama de arquitectura del Frontend generado")

def diagrama_flujo_backend():
    """Diagrama de flujo del Backend"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.set_title('Flujo de Procesamiento del Backend', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Elementos del flujo
    elements = [
        ('start', 1, 7, 'Request\nFrontend', 'green'),
        ('task', 2.5, 7, 'Middleware\nAuth', 'orange'),
        ('task', 4, 7, 'URL\nRouting', 'orange'),
        ('task', 5.5, 7, 'View\nProcessing', 'orange'),
        ('task', 7, 7, 'Serializer\nValidation', 'orange'),
        ('end', 8.5, 7, 'Response', 'red'),
        
        ('task', 2, 5.5, 'JWT\nValidation', 'blue'),
        ('task', 4, 5.5, 'Permissions\nCheck', 'blue'),
        ('task', 6, 5.5, 'Business\nLogic', 'blue'),
        ('task', 8, 5.5, 'Database\nOperations', 'blue'),
        
        ('data', 1.5, 4, 'User\nDatabase', 'purple'),
        ('data', 3.5, 4, 'Patient\nDatabase', 'purple'),
        ('data', 5.5, 4, 'Prediction\nDatabase', 'purple'),
        ('data', 7.5, 4, 'Medical\nData', 'purple'),
        
        ('task', 2.5, 2.5, 'ML\nModel', 'cyan'),
        ('task', 5, 2.5, 'Data\nProcessing', 'cyan'),
        ('task', 7.5, 2.5, 'Result\nGeneration', 'cyan')
    ]
    
    for elem_type, x, y, text, color in elements:
        text_color = get_text_color(color)
        if elem_type == 'start':
            circle = patches.Circle((x, y), 0.4, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'end':
            circle = patches.Circle((x, y), 0.4, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'task':
            rect = FancyBboxPatch((x-0.5, y-0.25), 1.0, 0.5, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'data':
            rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
    
    # Flujos
    flows = [
        (1, 7, 2.5, 7), (2.5, 7, 4, 7), (4, 7, 5.5, 7), (5.5, 7, 7, 7), (7, 7, 8.5, 7),
        (2.5, 7, 2, 5.5), (4, 7, 4, 5.5), (5.5, 7, 6, 5.5), (7, 7, 8, 5.5),
        (2, 5.5, 1.5, 4), (4, 5.5, 3.5, 4), (6, 5.5, 5.5, 4), (8, 5.5, 7.5, 4),
        (6, 5.5, 2.5, 2.5), (2.5, 2.5, 5, 2.5), (5, 2.5, 7.5, 2.5), (7.5, 2.5, 8, 5.5)
    ]
    
    for x1, y1, x2, y2 in flows:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=20, fc="black", ec="black", linewidth=2)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('backend_flujo.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('backend_flujo.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Diagrama de flujo del Backend generado")

def diagrama_flujo_frontend():
    """Diagrama de flujo del Frontend"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.set_title('Flujo de Interacción del Frontend', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Elementos del flujo
    elements = [
        ('start', 1, 7, 'User\nLogin', 'green'),
        ('task', 2.5, 7, 'Auth\nContext', 'orange'),
        ('task', 4, 7, 'Dashboard\nLoad', 'orange'),
        ('task', 5.5, 7, 'API\nCall', 'orange'),
        ('task', 7, 7, 'State\nUpdate', 'orange'),
        ('end', 8.5, 7, 'UI\nRender', 'red'),
        
        ('task', 2, 5.5, 'JWT\nStorage', 'blue'),
        ('task', 4, 5.5, 'Route\nProtection', 'blue'),
        ('task', 6, 5.5, 'Data\nFetching', 'blue'),
        ('task', 8, 5.5, 'Component\nUpdate', 'blue'),
        
        ('data', 1.5, 4, 'Local\nStorage', 'purple'),
        ('data', 3.5, 4, 'React\nState', 'purple'),
        ('data', 5.5, 4, 'API\nResponse', 'purple'),
        ('data', 7.5, 4, 'Component\nProps', 'purple'),
        
        ('task', 2.5, 2.5, 'Form\nValidation', 'cyan'),
        ('task', 5, 2.5, 'Error\nHandling', 'cyan'),
        ('task', 7.5, 2.5, 'Loading\nStates', 'cyan')
    ]
    
    for elem_type, x, y, text, color in elements:
        text_color = get_text_color(color)
        if elem_type == 'start':
            circle = patches.Circle((x, y), 0.4, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'end':
            circle = patches.Circle((x, y), 0.4, facecolor=color, edgecolor='black', linewidth=2)
            ax.add_patch(circle)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'task':
            rect = FancyBboxPatch((x-0.5, y-0.25), 1.0, 0.5, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)
        elif elem_type == 'data':
            rect = FancyBboxPatch((x-0.4, y-0.2), 0.8, 0.4, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax.add_patch(rect)
            ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
    
    # Flujos
    flows = [
        (1, 7, 2.5, 7), (2.5, 7, 4, 7), (4, 7, 5.5, 7), (5.5, 7, 7, 7), (7, 7, 8.5, 7),
        (2.5, 7, 2, 5.5), (4, 7, 4, 5.5), (5.5, 7, 6, 5.5), (7, 7, 8, 5.5),
        (2, 5.5, 1.5, 4), (4, 5.5, 3.5, 4), (6, 5.5, 5.5, 4), (8, 5.5, 7.5, 4),
        (6, 5.5, 2.5, 2.5), (2.5, 2.5, 5, 2.5), (5, 2.5, 7.5, 2.5), (7.5, 2.5, 8, 5.5)
    ]
    
    for x1, y1, x2, y2 in flows:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=20, fc="black", ec="black", linewidth=2)
        ax.add_patch(arrow)
    
    plt.tight_layout()
    plt.savefig('frontend_flujo.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('frontend_flujo.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Diagrama de flujo del Frontend generado")

def generar_todos_diagramas():
    """Generar todos los diagramas"""
    print("🎨 Generando diagramas de arquitectura y flujos...")
    
    diagrama_arquitectura_backend()
    diagrama_arquitectura_frontend()
    diagrama_flujo_backend()
    diagrama_flujo_frontend()
    
    print("\n✅ Todos los diagramas generados exitosamente:")
    print("   📄 backend_arquitectura.png/pdf")
    print("   📄 frontend_arquitectura.png/pdf")
    print("   📄 backend_flujo.png/pdf")
    print("   📄 frontend_flujo.png/pdf")

if __name__ == "__main__":
    generar_todos_diagramas() 