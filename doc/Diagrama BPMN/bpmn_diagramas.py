#!/usr/bin/env python3
"""
Script para generar diagramas BPMN profesionales del Sistema de Predicción Cardiovascular
Autor: Sistema de Predicción Cardiovascular
Fecha: 2024
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch, Circle, Rectangle, Polygon
import numpy as np
from typing import List, Dict, Tuple
import os

# Configuración profesional para BPMN
plt.rcParams['font.family'] = 'Arial'
plt.rcParams['font.size'] = 10
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['axes.linewidth'] = 1.5

class BPMNGenerador:
    def __init__(self):
        # Colores profesionales para BPMN
        self.colors = {
            'start_event': '#4CAF50',      # Verde
            'end_event': '#F44336',        # Rojo
            'task': '#2196F3',             # Azul
            'gateway': '#FF9800',          # Naranja
            'data_object': '#9C27B0',      # Púrpura
            'pool': '#E3F2FD',             # Azul claro
            'lane': '#F3E5F5',             # Púrpura claro
            'sequence_flow': '#424242',    # Gris oscuro
            'message_flow': '#FF5722',     # Rojo naranja
            'background': '#FFFFFF',       # Blanco
            'text': '#212121',             # Gris muy oscuro
            'border': '#BDBDBD'            # Gris medio
        }
        
    def crear_bpmn_as_is(self):
        """Crear diagrama BPMN del estado actual (AS-IS)"""
        fig, ax = plt.subplots(1, 1, figsize=(24, 16))
        fig.patch.set_facecolor(self.colors['background'])
        ax.set_facecolor(self.colors['background'])
        
        # Título
        self._crear_titulo(ax, 'BPMN AS-IS - PROCESO ACTUAL DE PREDICCIÓN CARDIOVASCULAR')
        
        # Pool principal
        self._crear_pool(ax, 0.05, 0.1, 0.9, 0.8, 'Sistema de Predicción Cardiovascular')
        
        # Lanes dentro del pool
        self._crear_lane(ax, 0.06, 0.75, 0.88, 0.13, 'Frontend (Next.js)')
        self._crear_lane(ax, 0.06, 0.6, 0.88, 0.13, 'Backend (Django)')
        self._crear_lane(ax, 0.06, 0.45, 0.88, 0.13, 'Base de Datos')
        self._crear_lane(ax, 0.06, 0.3, 0.88, 0.13, 'ML Engine')
        self._crear_lane(ax, 0.06, 0.15, 0.88, 0.13, 'Cache & Auth')
        
        # Elementos BPMN en Frontend
        start_event = self._crear_start_event(ax, 0.1, 0.82, 'Inicio')
        login_task = self._crear_task(ax, 0.2, 0.82, 'Login\nUsuario')
        dashboard_task = self._crear_task(ax, 0.35, 0.82, 'Dashboard\nPrincipal')
        form_task = self._crear_task(ax, 0.5, 0.82, 'Formulario\nDatos Paciente')
        submit_task = self._crear_task(ax, 0.65, 0.82, 'Enviar\nDatos')
        results_task = self._crear_task(ax, 0.8, 0.82, 'Mostrar\nResultados')
        
        # Elementos BPMN en Backend
        auth_task = self._crear_task(ax, 0.2, 0.67, 'Autenticar\nJWT')
        validate_task = self._crear_task(ax, 0.35, 0.67, 'Validar\nDatos')
        process_task = self._crear_task(ax, 0.5, 0.67, 'Procesar\nSolicitud')
        ml_task = self._crear_task(ax, 0.65, 0.67, 'Ejecutar\nPredicción')
        response_task = self._crear_task(ax, 0.8, 0.67, 'Generar\nRespuesta')
        
        # Elementos BPMN en Base de Datos
        db_save_task = self._crear_task(ax, 0.35, 0.52, 'Guardar\nPaciente')
        db_query_task = self._crear_task(ax, 0.5, 0.52, 'Consultar\nHistorial')
        db_pred_task = self._crear_task(ax, 0.65, 0.52, 'Guardar\nPredicción')
        
        # Elementos BPMN en ML Engine
        preprocess_task = self._crear_task(ax, 0.35, 0.37, 'Preprocesar\nDatos')
        model_task = self._crear_task(ax, 0.5, 0.37, 'Cargar\nModelo')
        predict_task = self._crear_task(ax, 0.65, 0.37, 'Realizar\nPredicción')
        
        # Elementos BPMN en Cache & Auth
        cache_task = self._crear_task(ax, 0.35, 0.22, 'Verificar\nCache')
        redis_task = self._crear_task(ax, 0.5, 0.22, 'Redis\nStorage')
        session_task = self._crear_task(ax, 0.65, 0.22, 'Mantener\nSesión')
        
        # Gateways
        auth_gateway = self._crear_gateway(ax, 0.25, 0.67, '¿Usuario\nVálido?')
        data_gateway = self._crear_gateway(ax, 0.4, 0.67, '¿Datos\nCompletos?')
        cache_gateway = self._crear_gateway(ax, 0.4, 0.22, '¿En\nCache?')
        
        # Data Objects
        patient_data = self._crear_data_object(ax, 0.15, 0.45, 'Datos\nPaciente')
        medical_record = self._crear_data_object(ax, 0.55, 0.45, 'Registro\nMédico')
        prediction_result = self._crear_data_object(ax, 0.75, 0.45, 'Resultado\nPredicción')
        
        # Flujos de secuencia
        self._crear_sequence_flow(ax, start_event, login_task)
        self._crear_sequence_flow(ax, login_task, auth_gateway)
        self._crear_sequence_flow(ax, auth_gateway, dashboard_task)
        self._crear_sequence_flow(ax, dashboard_task, form_task)
        self._crear_sequence_flow(ax, form_task, submit_task)
        self._crear_sequence_flow(ax, submit_task, validate_task)
        self._crear_sequence_flow(ax, validate_task, data_gateway)
        self._crear_sequence_flow(ax, data_gateway, process_task)
        self._crear_sequence_flow(ax, process_task, preprocess_task)
        self._crear_sequence_flow(ax, preprocess_task, model_task)
        self._crear_sequence_flow(ax, model_task, predict_task)
        self._crear_sequence_flow(ax, predict_task, ml_task)
        self._crear_sequence_flow(ax, ml_task, response_task)
        self._crear_sequence_flow(ax, response_task, results_task)
        
        # Flujos de datos
        self._crear_message_flow(ax, form_task, patient_data)
        self._crear_message_flow(ax, patient_data, db_save_task)
        self._crear_message_flow(ax, db_save_task, medical_record)
        self._crear_message_flow(ax, medical_record, predict_task)
        self._crear_message_flow(ax, predict_task, prediction_result)
        self._crear_message_flow(ax, prediction_result, db_pred_task)
        
        # Flujos de cache
        self._crear_sequence_flow(ax, process_task, cache_gateway)
        self._crear_sequence_flow(ax, cache_gateway, cache_task)
        self._crear_sequence_flow(ax, cache_task, redis_task)
        
        # End Event
        end_event = self._crear_end_event(ax, 0.9, 0.82, 'Fin')
        self._crear_sequence_flow(ax, results_task, end_event)
        
        # Leyenda
        self._crear_leyenda(ax, 0.02, 0.02)
        
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        plt.tight_layout()
        plt.savefig('bpmn_as_is.png', dpi=300, bbox_inches='tight', facecolor=self.colors['background'])
        plt.close()
        print("✅ BPMN AS-IS generado: bpmn_as_is.png")
        
    def crear_bpmn_to_be(self):
        """Crear diagrama BPMN del estado futuro (TO-BE)"""
        fig, ax = plt.subplots(1, 1, figsize=(24, 16))
        fig.patch.set_facecolor(self.colors['background'])
        ax.set_facecolor(self.colors['background'])
        
        # Título
        self._crear_titulo(ax, 'BPMN TO-BE - PROCESO FUTURO DE PREDICCIÓN CARDIOVASCULAR')
        
        # Pools principales
        self._crear_pool(ax, 0.02, 0.1, 0.3, 0.8, 'Frontend PWA')
        self._crear_pool(ax, 0.34, 0.1, 0.3, 0.8, 'API Gateway')
        self._crear_pool(ax, 0.66, 0.1, 0.3, 0.8, 'Microservicios')
        
        # Lanes en Frontend PWA
        self._crear_lane(ax, 0.03, 0.75, 0.28, 0.13, 'UI/UX')
        self._crear_lane(ax, 0.03, 0.6, 0.28, 0.13, 'PWA Core')
        self._crear_lane(ax, 0.03, 0.45, 0.28, 0.13, 'Offline Sync')
        
        # Lanes en API Gateway
        self._crear_lane(ax, 0.35, 0.75, 0.28, 0.13, 'Rate Limiting')
        self._crear_lane(ax, 0.35, 0.6, 0.28, 0.13, 'Load Balancer')
        self._crear_lane(ax, 0.35, 0.45, 0.28, 0.13, 'Circuit Breaker')
        
        # Lanes en Microservicios
        self._crear_lane(ax, 0.67, 0.75, 0.28, 0.13, 'User Service')
        self._crear_lane(ax, 0.67, 0.6, 0.28, 0.13, 'Patient Service')
        self._crear_lane(ax, 0.67, 0.45, 0.28, 0.13, 'Prediction Service')
        self._crear_lane(ax, 0.67, 0.3, 0.28, 0.13, 'Analytics Service')
        
        # Elementos en Frontend PWA
        start_event = self._crear_start_event(ax, 0.05, 0.82, 'Inicio')
        pwa_login = self._crear_task(ax, 0.1, 0.82, 'PWA\nLogin')
        offline_check = self._crear_task(ax, 0.15, 0.82, 'Verificar\nOffline')
        sync_data = self._crear_task(ax, 0.2, 0.82, 'Sincronizar\nDatos')
        
        # Elementos en API Gateway
        rate_limit = self._crear_task(ax, 0.37, 0.82, 'Rate\nLimiting')
        load_balance = self._crear_task(ax, 0.42, 0.82, 'Load\nBalancing')
        circuit_check = self._crear_task(ax, 0.47, 0.82, 'Circuit\nBreaker')
        
        # Elementos en Microservicios
        user_auth = self._crear_task(ax, 0.7, 0.82, 'OAuth 2.0\nAuth')
        patient_validate = self._crear_task(ax, 0.75, 0.82, 'Validar\nPaciente')
        prediction_ml = self._crear_task(ax, 0.8, 0.82, 'ML\nPipeline')
        analytics_process = self._crear_task(ax, 0.85, 0.82, 'Analytics\nReal-time')
        
        # Tasks en otras lanes
        # PWA Core
        pwa_core = self._crear_task(ax, 0.1, 0.67, 'PWA\nCore')
        service_worker = self._crear_task(ax, 0.15, 0.67, 'Service\nWorker')
        
        # Offline Sync
        offline_storage = self._crear_task(ax, 0.1, 0.52, 'IndexedDB\nStorage')
        sync_queue = self._crear_task(ax, 0.15, 0.52, 'Sync\nQueue')
        
        # Rate Limiting
        throttle = self._crear_task(ax, 0.37, 0.67, 'Throttle\nRequests')
        
        # Load Balancer
        distribute = self._crear_task(ax, 0.42, 0.67, 'Distribute\nLoad')
        
        # Circuit Breaker
        health_check = self._crear_task(ax, 0.47, 0.67, 'Health\nCheck')
        
        # User Service
        user_management = self._crear_task(ax, 0.7, 0.67, 'User\nManagement')
        mfa_check = self._crear_task(ax, 0.75, 0.67, 'MFA\nCheck')
        
        # Patient Service
        patient_db = self._crear_task(ax, 0.7, 0.52, 'Patient\nDatabase')
        fhir_integration = self._crear_task(ax, 0.75, 0.52, 'FHIR\nIntegration')
        
        # Prediction Service
        ml_pipeline = self._crear_task(ax, 0.7, 0.37, 'ML\nPipeline')
        model_versioning = self._crear_task(ax, 0.75, 0.37, 'Model\nVersioning')
        
        # Analytics Service
        real_time_analytics = self._crear_task(ax, 0.7, 0.22, 'Real-time\nAnalytics')
        kafka_streaming = self._crear_task(ax, 0.75, 0.22, 'Kafka\nStreaming')
        
        # Gateways
        offline_gateway = self._crear_gateway(ax, 0.12, 0.82, '¿Offline?')
        service_gateway = self._crear_gateway(ax, 0.44, 0.82, '¿Servicio\nDisponible?')
        auth_gateway = self._crear_gateway(ax, 0.72, 0.82, '¿Auth\nVálido?')
        
        # Data Objects
        pwa_data = self._crear_data_object(ax, 0.05, 0.45, 'PWA\nData')
        api_data = self._crear_data_object(ax, 0.35, 0.45, 'API\nData')
        microservice_data = self._crear_data_object(ax, 0.65, 0.45, 'Microservice\nData')
        
        # Flujos de secuencia principales
        self._crear_sequence_flow(ax, start_event, pwa_login)
        self._crear_sequence_flow(ax, pwa_login, offline_gateway)
        self._crear_sequence_flow(ax, offline_gateway, offline_check)
        self._crear_sequence_flow(ax, offline_check, sync_data)
        self._crear_sequence_flow(ax, sync_data, rate_limit)
        self._crear_sequence_flow(ax, rate_limit, load_balance)
        self._crear_sequence_flow(ax, load_balance, circuit_check)
        self._crear_sequence_flow(ax, circuit_check, service_gateway)
        self._crear_sequence_flow(ax, service_gateway, user_auth)
        self._crear_sequence_flow(ax, user_auth, auth_gateway)
        self._crear_sequence_flow(ax, auth_gateway, patient_validate)
        self._crear_sequence_flow(ax, patient_validate, prediction_ml)
        self._crear_sequence_flow(ax, prediction_ml, analytics_process)
        
        # Flujos paralelos
        self._crear_sequence_flow(ax, pwa_core, service_worker)
        self._crear_sequence_flow(ax, offline_storage, sync_queue)
        self._crear_sequence_flow(ax, throttle, distribute)
        self._crear_sequence_flow(ax, distribute, health_check)
        self._crear_sequence_flow(ax, user_management, mfa_check)
        self._crear_sequence_flow(ax, patient_db, fhir_integration)
        self._crear_sequence_flow(ax, ml_pipeline, model_versioning)
        self._crear_sequence_flow(ax, real_time_analytics, kafka_streaming)
        
        # Message Flows entre pools
        self._crear_message_flow(ax, sync_data, pwa_data)
        self._crear_message_flow(ax, pwa_data, rate_limit)
        self._crear_message_flow(ax, rate_limit, api_data)
        self._crear_message_flow(ax, api_data, user_auth)
        self._crear_message_flow(ax, user_auth, microservice_data)
        
        # End Event
        end_event = self._crear_end_event(ax, 0.9, 0.82, 'Fin')
        self._crear_sequence_flow(ax, analytics_process, end_event)
        
        # Leyenda
        self._crear_leyenda(ax, 0.02, 0.02)
        
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        plt.tight_layout()
        plt.savefig('bpmn_to_be.png', dpi=300, bbox_inches='tight', facecolor=self.colors['background'])
        plt.close()
        print("✅ BPMN TO-BE generado: bpmn_to_be.png")
        
    def _crear_titulo(self, ax, titulo):
        """Crear título profesional"""
        title_box = FancyBboxPatch((0.1, 0.92), 0.8, 0.06,
                                  boxstyle="round,pad=0.02",
                                  facecolor='#1976D2',
                                  edgecolor='white',
                                  linewidth=2,
                                  alpha=0.95)
        ax.add_patch(title_box)
        
        ax.text(0.5, 0.95, titulo,
                fontsize=18, fontweight='bold', ha='center', va='center',
                color='white')
        
    def _crear_pool(self, ax, x, y, width, height, nombre):
        """Crear pool BPMN"""
        # Pool principal
        pool = FancyBboxPatch((x, y), width, height,
                             boxstyle="round,pad=0.01",
                             facecolor=self.colors['pool'],
                             edgecolor=self.colors['border'],
                             linewidth=2)
        ax.add_patch(pool)
        
        # Título del pool
        ax.text(x + width/2, y + height - 0.02, nombre,
                fontsize=12, fontweight='bold', ha='center', va='top',
                color=self.colors['text'])
        
    def _crear_lane(self, ax, x, y, width, height, nombre):
        """Crear lane BPMN"""
        lane = FancyBboxPatch((x, y), width, height,
                             boxstyle="round,pad=0.005",
                             facecolor=self.colors['lane'],
                             edgecolor=self.colors['border'],
                             linewidth=1,
                             alpha=0.7)
        ax.add_patch(lane)
        
        # Título de la lane
        ax.text(x + 0.01, y + height - 0.01, nombre,
                fontsize=10, fontweight='bold', ha='left', va='top',
                color=self.colors['text'])
        
    def _crear_start_event(self, ax, x, y, nombre):
        """Crear evento de inicio"""
        circle = Circle((x, y), 0.02, facecolor=self.colors['start_event'],
                       edgecolor='white', linewidth=2)
        ax.add_patch(circle)
        
        ax.text(x, y + 0.03, nombre,
                fontsize=8, ha='center', va='bottom',
                color=self.colors['text'])
        
        return (x, y)
        
    def _crear_end_event(self, ax, x, y, nombre):
        """Crear evento de fin"""
        circle = Circle((x, y), 0.02, facecolor=self.colors['end_event'],
                       edgecolor='white', linewidth=2)
        ax.add_patch(circle)
        
        ax.text(x, y + 0.03, nombre,
                fontsize=8, ha='center', va='bottom',
                color=self.colors['text'])
        
        return (x, y)
        
    def _crear_task(self, ax, x, y, nombre):
        """Crear tarea BPMN"""
        task = Rectangle((x - 0.025, y - 0.015), 0.05, 0.03,
                        facecolor=self.colors['task'],
                        edgecolor='white', linewidth=2)
        ax.add_patch(task)
        
        ax.text(x, y, nombre,
                fontsize=8, ha='center', va='center',
                color='white', weight='bold')
        
        return (x, y)
        
    def _crear_gateway(self, ax, x, y, nombre):
        """Crear gateway BPMN"""
        # Diamante
        diamond = Polygon([(x, y + 0.02), (x + 0.02, y), (x, y - 0.02), (x - 0.02, y)],
                         facecolor=self.colors['gateway'],
                         edgecolor='white', linewidth=2)
        ax.add_patch(diamond)
        
        ax.text(x, y + 0.04, nombre,
                fontsize=8, ha='center', va='bottom',
                color=self.colors['text'])
        
        return (x, y)
        
    def _crear_data_object(self, ax, x, y, nombre):
        """Crear objeto de datos BPMN"""
        # Documento con esquina doblada
        doc = FancyBboxPatch((x - 0.025, y - 0.015), 0.05, 0.03,
                            boxstyle="round,pad=0.005",
                            facecolor=self.colors['data_object'],
                            edgecolor='white', linewidth=2)
        ax.add_patch(doc)
        
        # Esquina doblada
        fold = Polygon([(x + 0.02, y + 0.015), (x + 0.025, y + 0.01), (x + 0.02, y + 0.005)],
                      facecolor='white', edgecolor=self.colors['data_object'], linewidth=1)
        ax.add_patch(fold)
        
        ax.text(x, y, nombre,
                fontsize=8, ha='center', va='center',
                color='white', weight='bold')
        
        return (x, y)
        
    def _crear_sequence_flow(self, ax, start, end):
        """Crear flujo de secuencia"""
        # Línea con flecha
        arrow = ConnectionPatch(start, end, "data", "data",
                              arrowstyle="->", shrinkA=5, shrinkB=5,
                              mutation_scale=15, fc=self.colors['sequence_flow'],
                              ec=self.colors['sequence_flow'], linewidth=2)
        ax.add_patch(arrow)
        
    def _crear_message_flow(self, ax, start, end):
        """Crear flujo de mensaje"""
        # Línea punteada con flecha
        arrow = ConnectionPatch(start, end, "data", "data",
                              arrowstyle="->", shrinkA=5, shrinkB=5,
                              mutation_scale=15, fc=self.colors['message_flow'],
                              ec=self.colors['message_flow'], linewidth=2,
                              linestyle='--')
        ax.add_patch(arrow)
        
    def _crear_leyenda(self, ax, x, y):
        """Crear leyenda BPMN"""
        leyenda_items = [
            ('Evento Inicio', 'start_event'),
            ('Evento Fin', 'end_event'),
            ('Tarea', 'task'),
            ('Gateway', 'gateway'),
            ('Objeto Datos', 'data_object'),
            ('Flujo Secuencia', 'sequence_flow'),
            ('Flujo Mensaje', 'message_flow')
        ]
        
        for i, (nombre, color_key) in enumerate(leyenda_items):
            # Fondo de la leyenda
            leyenda_bg = FancyBboxPatch((x, y + i * 0.04), 0.15, 0.035,
                                       boxstyle="round,pad=0.005",
                                       facecolor='white',
                                       edgecolor=self.colors['border'],
                                       linewidth=1,
                                       alpha=0.9)
            ax.add_patch(leyenda_bg)
            
            # Símbolo
            if color_key in ['start_event', 'end_event']:
                symbol = Circle((x + 0.015, y + i * 0.04 + 0.0175), 0.008,
                               facecolor=self.colors[color_key],
                               edgecolor='white', linewidth=1)
            elif color_key == 'gateway':
                symbol = Polygon([(x + 0.015, y + i * 0.04 + 0.025), 
                                (x + 0.023, y + i * 0.04 + 0.0175),
                                (x + 0.015, y + i * 0.04 + 0.01),
                                (x + 0.007, y + i * 0.04 + 0.0175)],
                               facecolor=self.colors[color_key],
                               edgecolor='white', linewidth=1)
            elif color_key == 'data_object':
                symbol = FancyBboxPatch((x + 0.007, y + i * 0.04 + 0.01), 0.016, 0.015,
                                       boxstyle="round,pad=0.002",
                                       facecolor=self.colors[color_key],
                                       edgecolor='white', linewidth=1)
            elif color_key in ['sequence_flow', 'message_flow']:
                symbol = Rectangle((x + 0.007, y + i * 0.04 + 0.015), 0.016, 0.005,
                                 facecolor=self.colors[color_key],
                                 edgecolor='white', linewidth=1)
            else:
                symbol = Rectangle((x + 0.007, y + i * 0.04 + 0.01), 0.016, 0.015,
                                 facecolor=self.colors[color_key],
                                 edgecolor='white', linewidth=1)
            
            ax.add_patch(symbol)
            
            # Texto
            ax.text(x + 0.04, y + i * 0.04 + 0.0175, nombre,
                   fontsize=9, ha='left', va='center',
                   color=self.colors['text'])

def main():
    """Función principal"""
    print("🎯 Generando diagramas BPMN profesionales del Sistema de Predicción Cardiovascular...")
    print("=" * 80)
    
    # Crear instancia del generador
    generador = BPMNGenerador()
    
    try:
        # Generar BPMN AS-IS
        print("📊 Generando BPMN AS-IS...")
        generador.crear_bpmn_as_is()
        
        # Generar BPMN TO-BE
        print("🚀 Generando BPMN TO-BE...")
        generador.crear_bpmn_to_be()
        
        print("\n" + "=" * 80)
        print("✅ ¡Diagramas BPMN profesionales generados exitosamente!")
        print("\n📁 Archivos creados:")
        print("   • bpmn_as_is.png - Proceso actual (BPMN)")
        print("   • bpmn_to_be.png - Proceso futuro (BPMN)")
        print("\n🎯 Características de los diagramas BPMN:")
        print("   • Notación BPMN estándar")
        print("   • Pools y Lanes para separación de responsabilidades")
        print("   • Eventos de inicio y fin")
        print("   • Tareas y actividades")
        print("   • Gateways para decisiones")
        print("   • Objetos de datos")
        print("   • Flujos de secuencia y mensaje")
        print("   • Colores profesionales y consistentes")
        print("   • Leyenda explicativa")
        
    except Exception as e:
        print(f"❌ Error generando diagramas BPMN: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 