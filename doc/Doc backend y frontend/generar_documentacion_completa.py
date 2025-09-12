#!/usr/bin/env python3
"""
Script principal para generar documentación completa del Sistema de Predicción Cardiovascular
Autor: Sistema de Predicción Cardiovascular
Fecha: 2024
"""

import os
import sys
import subprocess

def instalar_dependencias():
    """Instalar dependencias necesarias"""
    print("📦 Instalando dependencias...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_documentacion.txt"])
        print("✅ Dependencias instaladas correctamente")
    except subprocess.CalledProcessError:
        print("❌ Error al instalar dependencias")
        return False
    return True

def generar_documentacion():
    """Generar toda la documentación"""
    print("🚀 Iniciando generación de documentación completa...")
    
    # Generar documentación del backend
    print("\n📋 Generando documentación del Backend...")
    try:
        subprocess.check_call([sys.executable, "generar_documentacion_backend.py"])
        print("✅ Documentación del Backend generada")
    except subprocess.CalledProcessError:
        print("❌ Error al generar documentación del Backend")
        return False
    
    # Generar documentación del frontend
    print("\n📋 Generando documentación del Frontend...")
    try:
        subprocess.check_call([sys.executable, "generar_documentacion_frontend.py"])
        print("✅ Documentación del Frontend generada")
    except subprocess.CalledProcessError:
        print("❌ Error al generar documentación del Frontend")
        return False
    
    return True

def limpiar_archivos_temporales():
    """Limpiar archivos temporales de imágenes"""
    print("\n🧹 Limpiando archivos temporales...")
    archivos_temp = [
        'backend_arquitectura.png',
        'backend_flujo.png',
        'frontend_arquitectura.png',
        'frontend_flujo.png'
    ]
    
    for archivo in archivos_temp:
        if os.path.exists(archivo):
            os.remove(archivo)
            print(f"   🗑️ Eliminado: {archivo}")

def mostrar_resultados():
    """Mostrar archivos generados"""
    print("\n📁 ARCHIVOS GENERADOS:")
    print("   📄 Documentacion_Backend.pdf")
    print("   📄 Documentacion_Frontend.pdf")
    print("\n🎉 ¡Documentación completa generada exitosamente!")
    print("\n📖 CONTENIDO DE LA DOCUMENTACIÓN:")
    print("   • Arquitectura detallada de cada componente")
    print("   • Diagramas de flujo y arquitectura")
    print("   • Guías de instalación paso a paso")
    print("   • Documentación de APIs y endpoints")
    print("   • Configuración de desarrollo y producción")
    print("   • Mejores prácticas y optimizaciones")

def main():
    """Función principal"""
    print("=" * 60)
    print("    DOCUMENTACIÓN SISTEMA DE PREDICCIÓN CARDIOVASCULAR")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("requirements_documentacion.txt"):
        print("❌ Error: No se encontró requirements_documentacion.txt")
        print("   Asegúrate de ejecutar este script desde el directorio 'Doc backend y frontend'")
        return
    
    # Instalar dependencias
    if not instalar_dependencias():
        return
    
    # Generar documentación
    if not generar_documentacion():
        return
    
    # Limpiar archivos temporales
    limpiar_archivos_temporales()
    
    # Mostrar resultados
    mostrar_resultados()

if __name__ == "__main__":
    main() 