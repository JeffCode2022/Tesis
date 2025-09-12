# Documentación Sistema de Predicción Cardiovascular

Este directorio contiene los scripts para generar documentación completa y profesional del Sistema de Predicción Cardiovascular, tanto para el backend como para el frontend.

## 📋 Contenido de la Documentación

### Backend (Documentacion_Backend.pdf)
- **Arquitectura del Sistema**: Diagramas y explicación de la arquitectura en capas
- **Tecnologías Utilizadas**: Django, PostgreSQL, Redis, JWT, ML
- **Estructura del Proyecto**: Organización de directorios y módulos
- **Configuración e Instalación**: Guía paso a paso
- **API REST**: Endpoints, ejemplos y documentación
- **Autenticación y Autorización**: JWT, permisos y roles
- **Base de Datos**: Modelos, relaciones y configuración
- **Servicios de Machine Learning**: Pipeline ML y modelos
- **Microservicios**: Arquitectura y servicios
- **Flujo de Procesamiento**: Diagramas de flujo
- **Despliegue**: Configuración de producción
- **Mantenimiento y Monitoreo**: Herramientas y tareas

### Frontend (Documentacion_Frontend.pdf)
- **Arquitectura del Frontend**: Componentes y estructura
- **Tecnologías Utilizadas**: Next.js, React, Tailwind CSS, shadcn/ui
- **Estructura del Proyecto**: Organización de archivos
- **Configuración e Instalación**: Setup completo
- **Componentes UI**: Catálogo de componentes
- **Routing y Navegación**: App Router de Next.js
- **Gestión de Estado**: Context API y hooks
- **Servicios y API**: Cliente API y servicios
- **Hooks y Utilidades**: Custom hooks y utilidades
- **Estilos y Temas**: Tailwind CSS y temas
- **Flujo de Interacción**: Diagramas de flujo
- **Despliegue**: Configuración de producción
- **Optimización y Rendimiento**: Métricas y optimizaciones

## 🚀 Generación de Documentación

### Requisitos Previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos para Generar

1. **Navegar al directorio**:
   ```bash
   cd "Doc backend y frontend"
   ```

2. **Ejecutar el script principal**:
   ```bash
   python generar_documentacion_completa.py
   ```

3. **Esperar la generación**:
   El script instalará automáticamente las dependencias y generará ambos PDFs.

### Archivos Generados
- `Documentacion_Backend.pdf` - Documentación completa del backend
- `Documentacion_Frontend.pdf` - Documentación completa del frontend

## 📦 Dependencias

El script instalará automáticamente:
- `matplotlib` - Para generar diagramas
- `reportlab` - Para generar PDFs
- `Pillow` - Para procesamiento de imágenes
- `numpy` - Para operaciones numéricas

## 🎨 Características de la Documentación

### Diagramas Incluidos
- **Arquitectura del Backend**: Capas, componentes y conexiones
- **Arquitectura del Frontend**: Componentes, servicios y flujos
- **Flujo de Procesamiento Backend**: Request/Response flow
- **Flujo de Interacción Frontend**: User interaction flow

### Contenido Técnico
- **Código de ejemplo**: Fragmentos de código relevantes
- **Tablas de configuración**: Endpoints, modelos, componentes
- **Guías paso a paso**: Instalación y configuración
- **Mejores prácticas**: Optimizaciones y recomendaciones

### Estructura Profesional
- **Portada**: Título, versión y autor
- **Índice**: Navegación completa
- **Capítulos numerados**: Organización clara
- **Estilos consistentes**: Tipografía y colores profesionales

## 🔧 Scripts Individuales

Si necesitas generar solo una parte:

```bash
# Solo backend
python generar_documentacion_backend.py

# Solo frontend
python generar_documentacion_frontend.py

# Solo diagramas
python generar_diagramas.py
```

## 📝 Personalización

Para personalizar la documentación:

1. **Modificar contenido**: Editar los scripts de generación
2. **Cambiar estilos**: Modificar los estilos de ReportLab
3. **Agregar diagramas**: Crear nuevas funciones de diagramas
4. **Incluir más secciones**: Agregar nuevos capítulos

## 🐛 Solución de Problemas

### Error de dependencias
```bash
pip install -r requirements_documentacion.txt
```

### Error de permisos
```bash
# En Windows
python -m pip install --user -r requirements_documentacion.txt

# En Linux/Mac
sudo pip install -r requirements_documentacion.txt
```

### Error de memoria
- Reducir la resolución de los diagramas (cambiar `dpi=300` a `dpi=150`)
- Generar los documentos por separado

## 📞 Soporte

Para problemas o mejoras en la documentación:
1. Revisar los logs de error
2. Verificar que todas las dependencias estén instaladas
3. Asegurar que Python 3.8+ esté disponible

---

**Nota**: Esta documentación se genera automáticamente y se actualiza con cada ejecución del script. 