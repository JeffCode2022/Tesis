#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
        import django
        django.setup()
        from django.db import connections
        from django.db.utils import OperationalError

        db_conn = connections['default']
        try:
            db_conn.cursor()
            print("✅ Conexión exitosa a la base de datos.")
        except OperationalError as e:
            print("❌ Error de conexión a la base de datos:", e)
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
