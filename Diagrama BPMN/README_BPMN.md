# Diagramas BPMN - Sistema de Predicción Cardiovascular

## 📊 Descripción

Este documento presenta los diagramas BPMN (Business Process Model and Notation) profesionales del Sistema de Predicción Cardiovascular, mostrando los flujos de procesos de negocio del estado actual (AS-IS) y el estado futuro (TO-BE).

## 🎯 Archivos Generados

### 1. `bpmn_as_is.png` - Proceso Actual (AS-IS)
**Arquitectura Monolítica con Flujo Secuencial**

**Elementos BPMN incluidos:**
- **Pool Principal**: Sistema de Predicción Cardiovascular
- **Lanes**: Frontend, Backend, Base de Datos, ML Engine, Cache & Auth
- **Eventos**: Inicio y Fin del proceso
- **Tareas**: Login, Dashboard, Formulario, Autenticación, Validación, etc.
- **Gateways**: Decisiones de autenticación, validación de datos, cache
- **Objetos de Datos**: Datos del paciente, registro médico, resultado de predicción
- **Flujos**: Secuencia y mensaje entre componentes

**Flujo del Proceso:**
1. **Inicio** → Login Usuario
2. **Autenticación JWT** → Dashboard Principal
3. **Formulario Datos** → Validación Backend
4. **Procesamiento** → ML Engine
5. **Predicción** → Generación de Respuesta
6. **Resultados** → **Fin**

### 2. `bpmn_to_be.png` - Proceso Futuro (TO-BE)
**Arquitectura de Microservicios con Flujos Distribuidos**

**Elementos BPMN incluidos:**
- **Pools Separados**: Frontend PWA, API Gateway, Microservicios
- **Lanes Especializadas**: UI/UX, PWA Core, Offline Sync, Rate Limiting, etc.
- **Eventos**: Inicio y Fin del proceso
- **Tareas Avanzadas**: OAuth 2.0, MFA, FHIR Integration, ML Pipeline, etc.
- **Gateways**: Decisiones de offline, disponibilidad de servicios, autenticación
- **Objetos de Datos**: PWA Data, API Data, Microservice Data
- **Flujos**: Secuencia, mensaje y flujos paralelos

**Flujo del Proceso:**
1. **Inicio** → PWA Login
2. **Verificación Offline** → Sincronización de Datos
3. **API Gateway** → Rate Limiting → Load Balancing → Circuit Breaker
4. **Microservicios** → OAuth 2.0 → Validación → ML Pipeline → Analytics
5. **Resultados** → **Fin**

## 🎨 Notación BPMN Utilizada

### Elementos Principales

#### Eventos
- **Evento de Inicio** (Círculo Verde): Punto de partida del proceso
- **Evento de Fin** (Círculo Rojo): Punto de terminación del proceso

#### Actividades
- **Tarea** (Rectángulo Azul): Actividad específica a realizar
- **Gateway** (Diamante Naranja): Punto de decisión en el flujo

#### Datos
- **Objeto de Datos** (Documento Púrpura): Información utilizada o producida

#### Flujos
- **Flujo de Secuencia** (Línea Sólida Negra): Flujo normal del proceso
- **Flujo de Mensaje** (Línea Punteada Roja): Comunicación entre pools

#### Contenedores
- **Pool** (Contenedor Principal): Representa un participante del proceso
- **Lane** (Subdivisión): Representa roles o responsabilidades dentro del pool

## 🔄 Comparación de Procesos

### AS-IS (Actual)
**Características:**
- ✅ Proceso monolítico y secuencial
- ✅ Autenticación JWT simple
- ✅ Cache Redis básico
- ✅ ML Engine estático
- ✅ Base de datos única
- ✗ Sin manejo offline
- ✗ Sin rate limiting
- ✗ Sin circuit breakers
- ✗ Sin integración externa

### TO-BE (Futuro)
**Características:**
- ✅ Arquitectura distribuida con microservicios
- ✅ OAuth 2.0 + MFA avanzado
- ✅ PWA con soporte offline
- ✅ API Gateway con rate limiting
- ✅ Circuit breakers para resiliencia
- ✅ Integración HL7 FHIR
- ✅ ML Pipeline con versioning
- ✅ Analytics en tiempo real
- ✅ Kafka para event streaming

## 🚀 Mejoras en el Proceso

### 1. **Escalabilidad del Proceso**
- **AS-IS**: Proceso secuencial limitado
- **TO-BE**: Procesos paralelos y distribuidos

### 2. **Resiliencia**
- **AS-IS**: Sin manejo de fallos
- **TO-BE**: Circuit breakers y health checks

### 3. **Experiencia de Usuario**
- **AS-IS**: Solo online
- **TO-BE**: Soporte offline con sincronización

### 4. **Seguridad**
- **AS-IS**: JWT básico
- **TO-BE**: OAuth 2.0 + MFA + Audit logging

### 5. **Integración**
- **AS-IS**: Sin integración externa
- **TO-BE**: HL7 FHIR + sistemas hospitalarios

### 6. **Monitoreo**
- **AS-IS**: Logging básico
- **TO-BE**: Analytics en tiempo real + métricas

## 📈 Beneficios del Nuevo Proceso

1. **Mayor Disponibilidad**: Circuit breakers y health checks
2. **Mejor Performance**: Load balancing y caching distribuido
3. **Escalabilidad**: Microservicios independientes
4. **Confiabilidad**: Manejo de fallos y recuperación
5. **Flexibilidad**: Soporte offline y sincronización
6. **Seguridad**: Autenticación avanzada y auditoría
7. **Integración**: Conectividad con sistemas externos
8. **Observabilidad**: Monitoreo completo del proceso

## 🛠️ Tecnologías del Proceso TO-BE

### Frontend PWA
- Progressive Web App
- Service Workers
- IndexedDB para almacenamiento offline
- Sincronización automática

### API Gateway
- Rate limiting
- Load balancing
- Circuit breakers
- Health checks

### Microservicios
- User Service (OAuth 2.0 + MFA)
- Patient Service (FHIR Integration)
- Prediction Service (ML Pipeline)
- Analytics Service (Real-time)

### Infraestructura
- Kubernetes orchestration
- Docker containers
- Kafka event streaming
- Redis cluster

## 📝 Notas Técnicas

- Los diagramas siguen la notación BPMN 2.0 estándar
- Colores consistentes para identificar tipos de elementos
- Leyenda explicativa incluida
- Flujos claros y bien definidos
- Separación clara de responsabilidades

## 🔧 Ejecutar el Script

```bash
# Generar diagramas BPMN
python bpmn_diagramas.py
```

## 📋 Elementos BPMN Detallados

### Eventos
- **Start Event**: Inicio del proceso de predicción
- **End Event**: Finalización del proceso

### Tareas Principales
- **Autenticación**: Verificación de identidad del usuario
- **Validación**: Verificación de datos del paciente
- **Predicción**: Ejecución del modelo de ML
- **Almacenamiento**: Guardado de resultados

### Gateways
- **Autenticación**: ¿Usuario válido?
- **Datos**: ¿Datos completos?
- **Cache**: ¿Datos en caché?
- **Offline**: ¿Modo offline?
- **Servicio**: ¿Servicio disponible?

### Objetos de Datos
- **Datos Paciente**: Información del paciente
- **Registro Médico**: Historial médico
- **Resultado Predicción**: Resultado del análisis

---

**Autor**: Sistema de Predicción Cardiovascular  
**Fecha**: 2024  
**Versión**: 1.0  
**Estándar**: BPMN 2.0 