# API de Predicción Cardiovascular

## Endpoints

### Predicciones

#### Obtener Predicción
```http
GET /api/predictions/{patient_id}/
```

**Respuesta**
```json
{
    "id": 1,
    "patient_id": 123,
    "risk_score": 0.75,
    "risk_level": "alto",
    "confidence_score": 0.85,
    "factors": [
        "Hipertensión",
        "Diabetes",
        "Obesidad"
    ],
    "recommendations": [
        "Control estricto de presión arterial",
        "Dieta controlada en carbohidratos",
        "Ejercicio regular"
    ],
    "created_at": "2024-03-20T10:00:00Z"
}
```

#### Crear Predicción
```http
POST /api/predictions/
```

**Request Body**
```json
{
    "patient_id": 123,
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

### Datos Médicos

#### Obtener Registro Médico
```http
GET /api/medical-records/{patient_id}/
```

#### Actualizar Registro Médico
```http
PUT /api/medical-records/{patient_id}/
```

## Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación.

### Obtener Token
```http
POST /api/token/
```

**Request Body**
```json
{
    "username": "usuario",
    "password": "contraseña"
}
```

**Respuesta**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Códigos de Error

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 