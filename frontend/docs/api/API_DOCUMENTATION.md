# Documentación de la API del Sistema Cardiovascular

## Índice
1. [Autenticación](#autenticación)
2. [Módulo de Pacientes](#módulo-de-pacientes)
3. [Módulo de Registros Médicos](#módulo-de-registros-médicos)
4. [Módulo de Predicciones](#módulo-de-predicciones)
5. [Módulo de Datos Médicos](#módulo-de-datos-médicos)
6. [Módulo de Integración](#módulo-de-integración)
7. [Códigos de Error](#códigos-de-error)
8. [Notas Importantes](#notas-importantes)

## Autenticación

### Obtener Token
```http
POST /api/token/
```
**Body:**
```json
{
    "username": "usuario",
    "password": "contraseña"
}
```
**Respuesta exitosa:**
```json
{
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>"
}
```
**Respuesta de error:**
```json
{
    "detail": "No active account found with the given credentials"
}
```

### Refrescar Token
```http
POST /api/token/refresh/
```
**Body:**
```json
{
    "refresh": "<jwt_refresh_token>"
}
```
**Respuesta exitosa:**
```json
{
    "access": "<nuevo_jwt_access_token>"
}
```

**Notas para pruebas:**
- Usa el token `access` en el header: `Authorization: Bearer <access>` para todas las consultas protegidas.
- Si el token expira, usa el endpoint de refresh.

## Módulo de Pacientes

### Listar Pacientes
```http
GET /api/patients/
```
**Query params soportados:**
- `sexo`, `hospital`, `medico_tratante` (filtro exacto)
- `search`: busca por nombre, apellidos, número de historia o email
- `ordering`: por ejemplo `?ordering=edad` o `?ordering=-created_at`
- Paginación: `?page=1&page_size=20`

**Respuesta exitosa:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid-paciente",
      "nombre_completo": "Juan Pérez",
      "edad": 45,
      "sexo": "M",
      "imc": 28.5,
      "numero_historia": "H1234",
      "ultimo_registro": "2024-03-20T10:00:00Z",
      "riesgo_actual": "Alto"
    }
  ]
}
```

### Obtener Paciente
```http
GET /api/patients/{id}/
```

### Crear Paciente
```http
POST /api/patients/
```
**Body:**
```json
{
    "name": "Juan Pérez",
    "age": 45,
    "gender": "M"
}
```

### Actualizar Paciente
```http
PUT /api/patients/{id}/
PATCH /api/patients/{id}/
```

### Eliminar Paciente
```http
DELETE /api/patients/{id}/
```

## Módulo de Registros Médicos

### Listar Registros Médicos
```http
GET /api/patients/medical-records/
```

### Obtener Registro Médico
```http
GET /api/patients/medical-records/{id}/
```

### Crear Registro Médico
```http
POST /api/patients/medical-records/
```
**Body:**
```json
{
    "patient_id": 1,
    "blood_pressure": "120/80",
    "heart_rate": 75,
    "cholesterol": 200,
    "glucose": 95
}
```

## Módulo de Predicciones

### Listar Predicciones
```http
GET /api/predictions/
```

### Obtener Predicción
```http
GET /api/predictions/{id}/
```

### Crear Predicción
```http
POST /api/predictions/
```
**Body:**
```json
{
    "patient_id": 1,
    "medical_data": {
        "presion_sistolica": 140,
        "presion_diastolica": 90,
        "colesterol_total": 240,
        "colesterol_hdl": 45,
        "glucosa": 110,
        "imc": 28.5
    }
}
```

### Predicción en Lote
```http
POST /api/predictions/batch_predict/
```
**Body:**
```json
{
    "data": [
        {
            "patient_id": 1,
            "medical_data": {
                "presion_sistolica": 140,
                "presion_diastolica": 90,
                "colesterol_total": 240,
                "colesterol_hdl": 45,
                "glucosa": 110,
                "imc": 28.5
            }
        }
    ]
}
```

### Métricas de Rendimiento
```http
GET /api/predictions/performance_metrics/
```
*Requiere permisos de administrador*

## Módulo de Datos Médicos

### Listar Datos Médicos
```http
GET /api/medical-data/
```

### Importar Datos Médicos
```http
POST /api/medical-data/import/
```

## Módulo de Integración

### Predicción en Lote desde Sistema Externo
```http
POST /api/integration/bulk_predict/
```
**Body:**
```json
{
    "external_patient_ids": ["12345", "67890", "11111"],
    "integration_name": "HIS_Principal"
}
```

## Códigos de Error

- 400: Bad Request - Error en los datos enviados
- 401: Unauthorized - No autenticado
- 403: Forbidden - No tiene permisos
- 404: Not Found - Recurso no encontrado
- 500: Internal Server Error - Error del servidor

## Notas Importantes

1. Todos los endpoints requieren autenticación mediante JWT excepto `/api/token/` y `/api/token/refresh/`
2. Para endpoints que requieren permisos de administrador, el usuario debe tener el flag `is_staff=True`
3. Las fechas se manejan en formato ISO 8601
4. Los IDs de pacientes externos deben ser únicos por sistema de integración 