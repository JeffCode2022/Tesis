#!/usr/bin/env python3
"""
Script para probar el modelo directamente y diagnosticar el problema de probabilidades
"""

import joblib
import numpy as np
import os
from pathlib import Path

def test_model():
    """Prueba el modelo directamente"""
    
    # Rutas de los archivos
    base_dir = Path(__file__).parent
    model_path = base_dir / 'ml_models' / 'trained_models' / 'cardiovascular_model.joblib'
    scaler_path = base_dir / 'ml_models' / 'trained_models' / 'scaler.pkl'
    
    print("=== DIAGNÓSTICO DEL MODELO ===")
    print(f"Modelo existe: {model_path.exists()}")
    print(f"Scaler existe: {scaler_path.exists()}")
    print(f"Tamaño del modelo: {model_path.stat().st_size if model_path.exists() else 'N/A'} bytes")
    print(f"Tamaño del scaler: {scaler_path.stat().st_size if scaler_path.exists() else 'N/A'} bytes")
    print()
    
    if not model_path.exists():
        print("❌ El modelo no existe!")
        return
    
    if not scaler_path.exists():
        print("❌ El scaler no existe!")
        return
    
    try:
        # Cargar modelo y scaler
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        print("✅ Modelo y scaler cargados correctamente")
        print(f"Tipo de modelo: {type(model)}")
        print(f"Número de clases: {model.n_classes_ if hasattr(model, 'n_classes_') else 'N/A'}")
        print(f"Clases: {model.classes_ if hasattr(model, 'classes_') else 'N/A'}")
        print()
        
        # Datos de prueba (los mismos que enviaste)
        test_data = {
            'edad': 24,  # 2000-09-30 -> 2025 = 25 años
            'imc': 24.22,  # 70kg / (1.70m)^2
            'presion_sistolica': 120,
            'presion_diastolica': 70,
            'colesterol': 100,
            'glucosa': 100,
            'indice_paquetes': 0,  # 0 cigarrillos
            'actividad_fisica': 2,  # moderado
            'sexo': 1,  # M
            'antecedentes': 0  # no
        }
        
        features = np.array([
            test_data['edad'],
            test_data['imc'],
            test_data['presion_sistolica'],
            test_data['presion_diastolica'],
            test_data['colesterol'],
            test_data['glucosa'],
            test_data['indice_paquetes'],
            test_data['actividad_fisica'],
            test_data['sexo'],
            test_data['antecedentes']
        ], dtype=np.float32)
        
        print("=== DATOS DE PRUEBA ===")
        print(f"Features: {features}")
        print()
        
        # Normalizar datos
        features_scaled = scaler.transform([features])[0]
        print("=== DATOS NORMALIZADOS ===")
        print(f"Features escalados: {features_scaled}")
        print()
        
        # Predicción
        class_probs = model.predict_proba([features_scaled])[0]
        predicted_class = int(np.argmax(class_probs))
        
        print("=== RESULTADO DE PREDICCIÓN ===")
        print(f"Probabilidades por clase: {class_probs}")
        print(f"Clase predicha: {predicted_class}")
        print(f"Probabilidad de la clase predicha: {class_probs[predicted_class]:.4f} ({class_probs[predicted_class]*100:.2f}%)")
        
        # Mapear clase a nivel de riesgo
        risk_mapping = {0: 'Bajo', 1: 'Medio', 2: 'Alto'}
        risk_level = risk_mapping.get(predicted_class, 'Desconocido')
        print(f"Nivel de riesgo: {risk_level}")
        print()
        
        # Probar con datos de alto riesgo
        print("=== PRUEBA CON DATOS DE ALTO RIESGO ===")
        high_risk_features = np.array([
            70,  # edad avanzada
            35,  # IMC alto (obesidad)
            180,  # presión sistólica alta
            110,  # presión diastólica alta
            300,  # colesterol muy alto
            150,  # glucosa alta
            30,   # mucho tabaco
            0,    # sedentario
            1,    # masculino
            1     # antecedentes
        ], dtype=np.float32)
        
        high_risk_scaled = scaler.transform([high_risk_features])[0]
        high_risk_probs = model.predict_proba([high_risk_scaled])[0]
        high_risk_class = int(np.argmax(high_risk_probs))
        high_risk_level = risk_mapping.get(high_risk_class, 'Desconocido')
        
        print(f"Features alto riesgo: {high_risk_features}")
        print(f"Probabilidades alto riesgo: {high_risk_probs}")
        print(f"Clase alto riesgo: {high_risk_class}")
        print(f"Probabilidad alto riesgo: {high_risk_probs[high_risk_class]:.4f} ({high_risk_probs[high_risk_class]*100:.2f}%)")
        print(f"Nivel de riesgo alto: {high_risk_level}")
        print()
        
        # Verificar distribución de clases del modelo
        print("=== DISTRIBUCIÓN DE CLASES DEL MODELO ===")
        if hasattr(model, 'classes_'):
            print(f"Clases disponibles: {model.classes_}")
        
        # Probar predicción directa (sin probabilidades)
        prediction = model.predict([features_scaled])[0]
        print(f"Predicción directa: {prediction}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_model() 