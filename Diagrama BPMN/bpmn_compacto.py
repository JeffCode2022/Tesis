#!/usr/bin/env python3
"""
Script para generar diagramas BPMN compactos del Sistema de Predicción Cardiovascular
Autor: Sistema de Predicción Cardiovascular
Fecha: 2024
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np

# Configuración de estilo
plt.style.use('default')
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 8  # Aumentar tamaño base
plt.rcParams['axes.linewidth'] = 2


def get_text_color(bg_color):
    # Colores de fondo oscuros
    dark_colors = ['blue', 'green', 'purple', 'gray', 'navy', 'darkgreen', 'darkblue', 'darkviolet']
    if bg_color in dark_colors:
        return 'white'
    # Colores de fondo claros
    return 'black'

def create_bpmn_compacto():
    """Crear diagramas BPMN compactos AS-IS (manual) y TO-BE (sistema) con letra más visible"""
    
    # Crear figura con dos subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(22, 14))
    fig.suptitle('Diagramas BPMN Compactos - Evaluación Cardiovascular', 
                 fontsize=14, fontweight='bold', y=0.96, color='black')
    
    # ==================== DIAGRAMA AS-IS COMPACTO (PROCESO MANUAL) ====================
    ax1.set_xlim(0, 10)
    ax1.set_ylim(0, 8)
    ax1.set_title('AS-IS: Proceso Manual Tradicional', fontsize=10, fontweight='bold', pad=20, color='black')
    ax1.axis('off')
    
    # Pool principal - Proceso Manual
    pool = FancyBboxPatch((0.2, 0.5), 9.6, 7, 
                         boxstyle="round,pad=0.1", 
                         facecolor='lightgray', 
                         edgecolor='black', 
                         linewidth=2.5)
    ax1.add_patch(pool)
    ax1.text(5, 7.5, 'Evaluación Cardiovascular Manual', 
             ha='center', va='center', fontsize=9, fontweight='bold', color='black')
    
    # Lanes para proceso manual
    lanes = [
        ('Recepción', 0.2, 6.5, 9.6, 0.8, 'lightyellow'),
        ('Evaluación Médica', 0.2, 4.5, 9.6, 1.8, 'lightgreen'),
        ('Documentación', 0.2, 2.5, 9.6, 1.8, 'lightcoral'),
        ('Archivo', 0.2, 0.7, 9.6, 1.6, 'lightblue')
    ]
    
    for name, x, y, w, h, color in lanes:
        lane = FancyBboxPatch((x, y), w, h, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=2)
        ax1.add_patch(lane)
        ax1.text(x + 0.5, y + h/2, name, ha='left', va='center', 
                fontsize=8, fontweight='bold', rotation=90, color='black')
    
    # Elementos del proceso manual AS-IS
    elements_as_is = [
        # Recepción
        ('start', 1, 6.8, 'Llegada\nPaciente', 'green'),
        ('task', 2.5, 6.8, 'Registro\nManual', 'orange'),
        ('task', 4, 6.8, 'Toma de\nSignos Vitales', 'orange'),
        ('task', 5.5, 6.8, 'Entrevista\nClínica', 'orange'),
        ('end', 7, 6.8, 'Derivación\nMédico', 'red'),
        
        # Evaluación Médica
        ('task', 1.5, 5.5, 'Examen\nFísico', 'orange'),
        ('task', 3, 5.5, 'Análisis\nSíntomas', 'orange'),
        ('task', 4.5, 5.5, 'Evaluación\nRiesgo', 'orange'),
        ('task', 6, 5.5, 'Decisión\nClínica', 'orange'),
        
        # Documentación
        ('data', 2, 3.5, 'Historia\nClínica', 'blue'),
        ('data', 4, 3.5, 'Exámenes\nLaboratorio', 'blue'),
        ('data', 6, 3.5, 'Electrocardiograma', 'blue'),
        
        # Archivo
        ('task', 3, 1.5, 'Archivo\nFísico', 'purple'),
        ('data', 5, 1.5, 'Carpeta\nPaciente', 'blue')
    ]
    
    # Dibujar elementos AS-IS manual
    for elem_type, x, y, text, color in elements_as_is:
        text_color = get_text_color(color)
        if elem_type == 'start':
            circle = patches.Circle((x, y), 0.35, facecolor=color, edgecolor='black', linewidth=2)
            ax1.add_patch(circle)
            ax1.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'end':
            circle = patches.Circle((x, y), 0.35, facecolor=color, edgecolor='black', linewidth=2)
            ax1.add_patch(circle)
            ax1.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'task':
            rect = FancyBboxPatch((x-0.5, y-0.25), 1.0, 0.5, 
                                 boxstyle="round,pad=0.04", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax1.add_patch(rect)
            ax1.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'data':
            rect = FancyBboxPatch((x-0.4, y-0.18), 0.8, 0.36, 
                                 boxstyle="round,pad=0.04", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax1.add_patch(rect)
            ax1.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
    
    # Flujos AS-IS manual
    flows_as_is = [
        (1, 6.8, 2.5, 6.8), (2.5, 6.8, 4, 6.8), (4, 6.8, 5.5, 6.8), (5.5, 6.8, 7, 6.8),
        (2.5, 6.8, 1.5, 5.5), (4, 6.8, 3, 5.5), (5.5, 6.8, 4.5, 5.5), (6, 5.5, 7, 6.8),
        (1.5, 5.5, 2, 3.5), (3, 5.5, 4, 3.5), (4.5, 5.5, 6, 3.5), (6, 5.5, 3, 1.5),
        (3, 1.5, 5, 1.5)
    ]
    
    for x1, y1, x2, y2 in flows_as_is:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=18, fc="black", ec="black", linewidth=2)
        ax1.add_patch(arrow)
    
    # ==================== DIAGRAMA TO-BE COMPACTO MEJORADO ====================
    ax2.set_xlim(0, 12)
    ax2.set_ylim(0, 10)
    ax2.set_title('TO-BE: Sistema de Predicción Automatizado', fontsize=10, fontweight='bold', pad=20, color='black')
    ax2.axis('off')
    
    # Pool principal TO-BE
    pool_tobe = FancyBboxPatch((0.2, 0.5), 11.6, 9, 
                              boxstyle="round,pad=0.1", 
                              facecolor='lightblue', 
                              edgecolor='navy', 
                              linewidth=2.5)
    ax2.add_patch(pool_tobe)
    ax2.text(6, 9.2, 'Sistema de Predicción Cardiovascular Automatizado', 
             ha='center', va='center', fontsize=9, fontweight='bold', color='black')
    
    # Lanes TO-BE con mejor espaciado
    lanes_tobe = [
        ('Frontend (Next.js)', 0.2, 8.2, 11.6, 0.8, 'lightyellow'),
        ('API Gateway', 0.2, 7.2, 11.6, 0.8, 'lightcyan'),
        ('Microservicios', 0.2, 5.2, 11.6, 1.8, 'lightgreen'),
        ('Base de Datos', 0.2, 3.2, 11.6, 1.8, 'lightcoral'),
        ('ML Services', 0.2, 1.2, 11.6, 1.8, 'lightpink'),
        ('Monitoreo', 0.2, 0.7, 11.6, 0.4, 'lightgray')
    ]
    
    for name, x, y, w, h, color in lanes_tobe:
        lane = FancyBboxPatch((x, y), w, h, 
                             boxstyle="round,pad=0.05", 
                             facecolor=color, 
                             edgecolor='black', 
                             linewidth=2)
        ax2.add_patch(lane)
        ax2.text(x + 0.4, y + h/2, name, ha='left', va='center', 
                fontsize=8, fontweight='bold', rotation=90, color='black')
    
    # Elementos del proceso TO-BE con mejor distribución
    elements_tobe = [
        # Frontend
        ('start', 1, 8.5, 'Inicio', 'green'),
        ('task', 2.5, 8.5, 'Login\nSSO', 'orange'),
        ('task', 4, 8.5, 'Dashboard\nInteractivo', 'orange'),
        ('task', 5.5, 8.5, 'Análisis\nTiempo Real', 'orange'),
        ('task', 7, 8.5, 'Reportes\nAvanzados', 'orange'),
        ('end', 8.5, 8.5, 'Fin', 'red'),
        
        # API Gateway
        ('task', 2, 7.5, 'Rate\nLimiting', 'cyan'),
        ('task', 4, 7.5, 'Auth\nJWT', 'cyan'),
        ('task', 6, 7.5, 'Load\nBalancer', 'cyan'),
        ('task', 8, 7.5, 'API\nDocs', 'cyan'),
        
        # Microservicios
        ('task', 1.5, 6.2, 'Auth\nService', 'green'),
        ('task', 3, 6.2, 'Patient\nService', 'green'),
        ('task', 4.5, 6.2, 'Prediction\nService', 'green'),
        ('task', 6, 6.2, 'Analytics\nService', 'green'),
        ('task', 7.5, 6.2, 'Notification\nService', 'green'),
        ('task', 9, 6.2, 'Integration\nService', 'green'),
        
        # Base de Datos
        ('data', 2, 4.2, 'Users\nDB', 'blue'),
        ('data', 4, 4.2, 'Patients\nDB', 'blue'),
        ('data', 6, 4.2, 'Predictions\nDB', 'blue'),
        ('data', 8, 4.2, 'Analytics\nDB', 'blue'),
        ('data', 10, 4.2, 'External\nDB', 'blue'),
        
        # ML Services
        ('task', 2.5, 2.2, 'ML\nPipeline', 'purple'),
        ('task', 4.5, 2.2, 'Model\nRegistry', 'purple'),
        ('task', 6.5, 2.2, 'A/B\nTesting', 'purple'),
        ('task', 8.5, 2.2, 'Auto\nScaling', 'purple'),
        
        # Monitoreo
        ('task', 3, 0.9, 'Logs', 'gray'),
        ('task', 5, 0.9, 'Metrics', 'gray'),
        ('task', 7, 0.9, 'Alerts', 'gray'),
        ('task', 9, 0.9, 'Health\nCheck', 'gray')
    ]
    
    # Dibujar elementos TO-BE
    for elem_type, x, y, text, color in elements_tobe:
        text_color = get_text_color(color)
        if elem_type == 'start':
            circle = patches.Circle((x, y), 0.3, facecolor=color, edgecolor='black', linewidth=2)
            ax2.add_patch(circle)
            ax2.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'end':
            circle = patches.Circle((x, y), 0.3, facecolor=color, edgecolor='black', linewidth=2)
            ax2.add_patch(circle)
            ax2.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'task':
            rect = FancyBboxPatch((x-0.45, y-0.2), 0.9, 0.4, 
                                 boxstyle="round,pad=0.04", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax2.add_patch(rect)
            ax2.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        elif elem_type == 'data':
            rect = FancyBboxPatch((x-0.35, y-0.14), 0.7, 0.28, 
                                 boxstyle="round,pad=0.04", 
                                 facecolor=color, 
                                 edgecolor='black', 
                                 linewidth=2)
            ax2.add_patch(rect)
            ax2.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
    
    # Flujos TO-BE con mejor organización
    flows_tobe = [
        # Flujo principal frontend
        (1, 8.5, 2.5, 8.5), (2.5, 8.5, 4, 8.5), (4, 8.5, 5.5, 8.5), 
        (5.5, 8.5, 7, 8.5), (7, 8.5, 8.5, 8.5),
        
        # Conexiones API Gateway
        (2.5, 8.5, 2, 7.5), (4, 8.5, 4, 7.5), (5.5, 8.5, 6, 7.5), (7, 8.5, 8, 7.5),
        
        # Conexiones microservicios
        (2, 7.5, 1.5, 6.2), (4, 7.5, 3, 6.2), (6, 7.5, 4.5, 6.2), 
        (8, 7.5, 6, 6.2), (8, 7.5, 7.5, 6.2), (8, 7.5, 9, 6.2),
        
        # Conexiones base de datos
        (1.5, 6.2, 2, 4.2), (3, 6.2, 4, 4.2), (4.5, 6.2, 6, 4.2), 
        (6, 6.2, 8, 4.2), (9, 6.2, 10, 4.2),
        
        # Conexiones ML
        (4.5, 6.2, 2.5, 2.2), (6, 6.2, 4.5, 2.2), (7.5, 6.2, 6.5, 2.2), (9, 6.2, 8.5, 2.2),
        
        # Conexiones monitoreo
        (1.5, 6.2, 3, 0.9), (3, 6.2, 5, 0.9), (4.5, 6.2, 7, 0.9), (6, 6.2, 9, 0.9)
    ]
    
    for x1, y1, x2, y2 in flows_tobe:
        arrow = ConnectionPatch((x1, y1), (x2, y2), "data", "data",
                               arrowstyle="->", shrinkA=5, shrinkB=5,
                               mutation_scale=16, fc="black", ec="black", linewidth=2)
        ax2.add_patch(arrow)
    
    # Leyenda mejorada
    legend_elements = [
        patches.Patch(color='green', label='Evento Inicio/Fin'),
        patches.Patch(color='orange', label='Tarea'),
        patches.Patch(color='blue', label='Objeto de Datos'),
        patches.Patch(color='purple', label='Servicio ML'),
        patches.Patch(color='cyan', label='API Gateway'),
        patches.Patch(color='gray', label='Monitoreo')
    ]
    
    fig.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, 0.02), 
              ncol=6, fontsize=9, frameon=True, fancybox=True, shadow=True)
    
    plt.tight_layout()
    plt.subplots_adjust(top=0.93, bottom=0.10)
    
    # Guardar diagramas
    plt.savefig('diagramas_bpmn_manual_vs_automatizado.png', 
                dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('diagramas_bpmn_manual_vs_automatizado.pdf', 
                bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    
    print("✅ Diagramas BPMN manual vs automatizado generados:")
    print("   📄 diagramas_bpmn_manual_vs_automatizado.png")
    print("   📄 diagramas_bpmn_manual_vs_automatizado.pdf")
    
    plt.show()

if __name__ == "__main__":
    create_bpmn_compacto() 