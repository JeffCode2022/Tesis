# Configuración de PostgreSQL para Sistema Cardiovascular

## ⚠️ Problema Detectado

El sistema está configurado para usar PostgreSQL pero hay un error de autenticación:
```
FATAL: la autentificación password falló para el usuario "postgres"
```

## 🔧 Soluciones

### Opción 1: Configurar PostgreSQL (Recomendado para Producción)

1. **Verificar que PostgreSQL esté ejecutándose:**
   ```bash
   # En Windows
   services.msc
   # Buscar "PostgreSQL" y verificar que esté "Ejecutándose"
   ```

2. **Configurar usuario postgres:**
   ```sql
   -- Conectar como superusuario
   psql -U postgres
   
   -- Cambiar contraseña del usuario postgres
   ALTER USER postgres PASSWORD 'postgres';
   
   -- Crear base de datos
   CREATE DATABASE cardiovascular_db WITH ENCODING='UTF8';
   
   -- Otorgar permisos
   GRANT ALL PRIVILEGES ON DATABASE cardiovascular_db TO postgres;
   ```

3. **Verificar configuración en pg_hba.conf:**
   ```
   # Buscar archivo pg_hba.conf (usualmente en C:\Program Files\PostgreSQL\XX\data\)
   # Asegurar que contenga:
   local   all             postgres                                md5
   host    all             all             127.0.0.1/32            md5
   ```

4. **Reiniciar PostgreSQL** después de cambios en configuración.

### Opción 2: Usar SQLite para Desarrollo (Actual)

El sistema automáticamente detectó el problema y está usando SQLite como fallback.

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No requiere configuración adicional
- ✅ Ideal para desarrollo y pruebas

**Desventajas:**
- ⚠️ No recomendado para producción
- ⚠️ Diferencias menores en tipos de datos
- ⚠️ Sin conexiones concurrentes

## 🚀 Estado Actual del Sistema

```
✅ Modelo ML: Disponible
✅ Scaler: Disponible  
✅ Validador: 15 rangos + 4 categorías
⚠️ Base de datos: SQLite (fallback)
```

## 📋 Próximos Pasos

1. **Para continuar desarrollo:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py check_system --test-validation
   ```

2. **Para configurar PostgreSQL:**
   - Seguir "Opción 1" arriba
   - Ejecutar: `python diagnose_db.py` para verificar
   - Ejecutar: `python manage.py check_system`

## 🎯 Validador Funcionando Perfectamente

El validador está detectando correctamente errores médicos:
- ✅ 11 errores detectados en datos inválidos
- ✅ Validación de rangos fisiológicos
- ✅ Validación de consistencia médica
- ✅ Advertencias para valores anómalos

**El sistema está listo para uso en desarrollo con SQLite.**
