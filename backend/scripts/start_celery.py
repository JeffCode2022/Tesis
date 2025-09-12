#!/usr/bin/env python
"""
Script para iniciar workers de Celery para el sistema cardiovascular
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

def start_celery_worker():
    """Inicia el worker de Celery"""
    print("🚀 Iniciando Celery Worker para Sistema Cardiovascular...")
    print("=" * 60)
    
    # Comando para Windows
    if os.name == 'nt':
        cmd = [
            'celery', '-A', 'cardiovascular_project', 'worker',
            '--loglevel=info',
            '--pool=solo',  # Para Windows
            '--concurrency=1',
            '--queues=celery,predictions,integration,analytics'
        ]
    else:
        # Comando para Linux/Mac
        cmd = [
            'celery', '-A', 'cardiovascular_project', 'worker',
            '--loglevel=info',
            '--concurrency=4',
            '--queues=celery,predictions,integration,analytics'
        ]
    
    print(f"Ejecutando: {' '.join(cmd)}")
    print()
    print("Colas configuradas:")
    print("  - celery (general)")
    print("  - predictions (predicciones ML)")
    print("  - integration (sistemas externos)")
    print("  - analytics (reportes y análisis)")
    print()
    print("Para detener el worker: Ctrl+C")
    print("=" * 60)
    
    # Ejecutar comando
    import subprocess
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Worker detenido por el usuario")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error ejecutando worker: {e}")
        return 1
    except FileNotFoundError:
        print("\n❌ Error: Celery no está instalado o no está en el PATH")
        print("Instalar con: pip install celery[redis]")
        return 1
    
    return 0

def start_celery_beat():
    """Inicia el scheduler de Celery Beat"""
    print("⏰ Iniciando Celery Beat Scheduler...")
    print("=" * 60)
    
    cmd = [
        'celery', '-A', 'cardiovascular_project', 'beat',
        '--loglevel=info',
        '--scheduler=django_celery_beat.schedulers:DatabaseScheduler'
    ]
    
    print(f"Ejecutando: {' '.join(cmd)}")
    print()
    print("Tareas periódicas configuradas:")
    print("  - cleanup-old-predictions (diario)")
    print("  - sync-external-data (cada hora)")
    print("  - generate-analytics-report (cada 6 horas)")
    print()
    print("Para detener el scheduler: Ctrl+C")
    print("=" * 60)
    
    import subprocess
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Scheduler detenido por el usuario")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error ejecutando scheduler: {e}")
        return 1
    except FileNotFoundError:
        print("\n❌ Error: Celery no está instalado o no está en el PATH")
        print("Instalar con: pip install celery[redis] django-celery-beat")
        return 1
    
    return 0

def show_help():
    """Muestra ayuda de uso"""
    print("🔧 Script de Control de Celery - Sistema Cardiovascular")
    print("=" * 60)
    print()
    print("Uso: python start_celery.py [comando]")
    print()
    print("Comandos disponibles:")
    print("  worker    - Inicia el worker de Celery")
    print("  beat      - Inicia el scheduler Beat")
    print("  help      - Muestra esta ayuda")
    print()
    print("Ejemplos:")
    print("  python start_celery.py worker")
    print("  python start_celery.py beat")
    print()
    print("Requisitos:")
    print("  - Redis ejecutándose en localhost:6379")
    print("  - Celery instalado: pip install celery[redis]")
    print("  - Django-celery-beat: pip install django-celery-beat")
    print()
    print("Para desarrollo, ejecutar en terminales separadas:")
    print("  Terminal 1: python start_celery.py worker")
    print("  Terminal 2: python start_celery.py beat")

def main():
    """Función principal"""
    if len(sys.argv) < 2:
        show_help()
        return 1
    
    command = sys.argv[1].lower()
    
    if command == 'worker':
        return start_celery_worker()
    elif command == 'beat':
        return start_celery_beat()
    elif command in ['help', '--help', '-h']:
        show_help()
        return 0
    else:
        print(f"❌ Comando desconocido: {command}")
        print("Usa 'python start_celery.py help' para ver comandos disponibles")
        return 1

if __name__ == '__main__':
    sys.exit(main())
