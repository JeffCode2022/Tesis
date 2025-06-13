# Guía de Instalación

## Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- virtualenv (recomendado)
- Git

## Pasos de Instalación

1. **Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/cardiovascular_system.git
cd cardiovascular_system
```

2. **Crear y Activar Entorno Virtual**
```bash
python -m venv env
# En Windows
env\Scripts\activate
# En Linux/Mac
source env/bin/activate
```

3. **Instalar Dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar Variables de Entorno**
Crear un archivo `.env` en la raíz del proyecto:
```env
DEBUG=True
SECRET_KEY=tu-clave-secreta
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/cardiovascular_db
```

5. **Aplicar Migraciones**
```bash
python manage.py migrate
```

6. **Crear Superusuario**
```bash
python manage.py createsuperuser
```

7. **Recolectar Archivos Estáticos**
```bash
python manage.py collectstatic
```

## Configuración del Entorno de Desarrollo

1. **Instalar Dependencias de Desarrollo**
```bash
pip install -r requirements-dev.txt
```

2. **Configurar Pre-commit Hooks**
```bash
pre-commit install
```

3. **Ejecutar Tests**
```bash
python manage.py test
```

## Configuración de la Base de Datos

El proyecto utiliza PostgreSQL como base de datos principal.

1. **Instalar PostgreSQL**
- Windows: Descargar e instalar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- Linux: `sudo apt-get install postgresql`
- Mac: `brew install postgresql`

2. **Crear Base de Datos**
```sql
CREATE DATABASE cardiovascular_db;
CREATE USER cardiovascular_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE cardiovascular_db TO cardiovascular_user;
```

## Configuración de Redis (Opcional)

Para habilitar el caché y las colas de tareas:

1. **Instalar Redis**
- Windows: Descargar e instalar desde [redis.io](https://redis.io/download)
- Linux: `sudo apt-get install redis-server`
- Mac: `brew install redis`

2. **Iniciar Servicio Redis**
```bash
# Windows
redis-server

# Linux/Mac
sudo service redis-server start
```

## Verificación de la Instalación

1. **Iniciar Servidor de Desarrollo**
```bash
python manage.py runserver
```

2. **Acceder a la Aplicación**
Abrir un navegador y visitar:
- http://localhost:8000/ (Frontend)
- http://localhost:8000/admin/ (Panel de Administración)
- http://localhost:8000/api/ (API REST)

## Solución de Problemas

### Errores Comunes

1. **Error de Conexión a la Base de Datos**
- Verificar que PostgreSQL esté corriendo
- Confirmar credenciales en `.env`
- Verificar que la base de datos exista

2. **Error de Dependencias**
- Asegurarse de que el entorno virtual esté activado
- Reinstalar dependencias: `pip install -r requirements.txt --force-reinstall`

3. **Error de Archivos Estáticos**
- Ejecutar `python manage.py collectstatic`
- Verificar permisos en la carpeta `static`

### Soporte

Para reportar problemas o solicitar ayuda:
1. Revisar la [documentación](docs/)
2. Abrir un issue en GitHub
3. Contactar al equipo de soporte 