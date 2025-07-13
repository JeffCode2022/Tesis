#!/usr/bin/env python3
"""
Script para probar el endpoint de predicción y identificar errores 400
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_prediction_endpoint():
    """Prueba el endpoint de predicción con datos de ejemplo"""
    
    # Datos de prueba que simulan lo que envía el frontend
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
    
    print("=== PRUEBA DEL ENDPOINT DE PREDICCIÓN ===")
    print(f"URL: {API_URL}/predictions/predictions/predict/")
    print(f"Datos enviados: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        # Primero probar el endpoint de predicción directamente
        response = requests.post(
            f"{API_URL}/predictions/predictions/predict/",
            json=test_data,
            headers={"Content-Type": "application/json"}
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
        
    except Exception as e:
        print(f"Error en la petición: {e}")

def test_patient_creation():
    """Prueba la creación de paciente"""
    
    patient_data = {
        "nombre": "Jefferson",
        "apellidos": "Chunga Zapata",
        "dni": "75920737",
        "fecha_nacimiento": "1990-01-01",
        "sexo": "M",
        "peso": 70.0,
        "altura": 170.0,
        "numero_historia": "HC123456"
    }
    
    print("\n=== PRUEBA DE CREACIÓN DE PACIENTE ===")
    print(f"URL: {API_URL}/patients/")
    print(f"Datos enviados: {json.dumps(patient_data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/patients/",
            json=patient_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 201:
            patient = response.json()
            print(f"Paciente creado con ID: {patient.get('id')}")
            return patient.get('id')
        else:
            print("Error creando paciente")
            return None
            
    except Exception as e:
        print(f"Error en la petición: {e}")
        return None

def test_medical_record_creation(patient_id):
    """Prueba la creación de registro médico"""
    
    medical_data = {
        "presion_sistolica": 140,
        "presion_diastolica": 90,
        "colesterol": 200.0,
        "glucosa": 100.0,
        "cigarrillos_dia": 0,
        "anos_tabaquismo": 0,
        "actividad_fisica": "sedentario",
        "antecedentes_cardiacos": "no"
    }
    
    print(f"\n=== PRUEBA DE CREACIÓN DE REGISTRO MÉDICO ===")
    print(f"URL: {API_URL}/patients/{patient_id}/add_medical_record/")
    print(f"Datos enviados: {json.dumps(medical_data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/patients/{patient_id}/add_medical_record/",
            json=medical_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 400:
            print("\n=== ERROR 400 EN REGISTRO MÉDICO ===")
            try:
                error_data = response.json()
                print(f"Error JSON: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error no es JSON válido: {response.text}")
        
        return response.status_code == 201
        
    except Exception as e:
        print(f"Error en la petición: {e}")
        return False

if __name__ == "__main__":
    print("Iniciando pruebas de endpoints...")
    print("=" * 50)
    
    # Probar predicción directa
    test_prediction_endpoint()
    
    # Probar creación de paciente
    patient_id = test_patient_creation()
    
    # Si se creó el paciente, probar registro médico
    if patient_id:
        test_medical_record_creation(patient_id)
    
    print("\n" + "=" * 50)
    print("Pruebas completadas.") 