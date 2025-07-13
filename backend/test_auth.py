#!/usr/bin/env python3
"""
Script para probar la autenticación y el endpoint de predicción
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_login():
    """Prueba el login para obtener un token"""
    
    login_data = {
        "email": "meison@gmail.com",
        "password": "12345678"
    }
    
    print("=== PRUEBA DE LOGIN ===")
    print(f"URL: {API_URL}/authentication/login/")
    print(f"Datos enviados: {json.dumps(login_data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/authentication/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print(f"Token obtenido: {token[:20]}..." if token else "No token")
            return token
        else:
            print("Error en login")
            return None
            
    except Exception as e:
        print(f"Error en la petición: {e}")
        return None

def test_prediction_with_auth(token):
    """Prueba el endpoint de predicción con autenticación"""
    
    test_data = {
        "dni": "75920737",
        "nombre": "Jefferson",
        "apellidos": "Chunga Zapata", 
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "peso": 70.0,
        "altura": 170.0,
        "numero_historia": "HC123456",
        "presion_sistolica": 140,
        "presion_diastolica": 90,
        "colesterol": 200.0,
        "glucosa": 100.0,
        "cigarrillos_dia": 0,
        "anos_tabaquismo": 0,
        "actividad_fisica": "sedentario",
        "antecedentes_cardiacos": "no"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    print("\n=== PRUEBA DEL ENDPOINT DE PREDICCIÓN CON AUTH ===")
    print(f"URL: {API_URL}/predictions/predictions/predict/")
    print(f"Headers: {json.dumps({k: v[:20] + '...' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")
    print(f"Datos enviados: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/predictions/predictions/predict/",
            json=test_data,
            headers=headers
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 400:
            print("\n=== ERROR 400 DETECTADO ===")
            try:
                error_data = response.json()
                print(f"Error JSON: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error no es JSON válido: {response.text}")
        elif response.status_code == 200:
            print("\n=== PREDICCIÓN EXITOSA ===")
            try:
                result = response.json()
                print(f"Resultado: {json.dumps(result, indent=2)}")
            except:
                print(f"Respuesta: {response.text}")
        
    except Exception as e:
        print(f"Error en la petición: {e}")

if __name__ == "__main__":
    print("Iniciando pruebas de autenticación...")
    print("=" * 50)
    
    # Probar login
    token = test_login()
    
    if token:
        # Probar predicción con autenticación
        test_prediction_with_auth(token)
    else:
        print("No se pudo obtener token de autenticación")
    
    print("\n" + "=" * 50)
    print("Pruebas completadas.") 