# Mapeo del proyecto a CRISP-DM

Este documento resume cómo el trabajo de ML del sistema cardiovascular sigue la metodología CRISP-DM.

## 1. Business Understanding (Comprensión del negocio)
- Objetivo: apoyar la detección de riesgo cardiovascular (cardio = 1) desde una API para el frontend.
- Consumo: endpoint de predicción en el backend Django para integrarse con el frontend (Next.js).

Artefactos:
- Backend Django: `backend/` (DRF, endpoints de predicción).
- Predictor en producción: `backend/ml_models/cardiovascular_predictor.py`.

## 2. Data Understanding (Comprensión de los datos)
- Dataset: Kaggle “Cardiovascular Disease dataset”.
- Exploración: info/describe, distribución de variables y etiquetas en el notebook.

Artefactos:
- Notebook: `Cardio_Prediccion_Modelos.ipynb` (carga de datos, inspección).
- Datos de entrenamiento: `backend/ml_models/training/cardio_train.csv`.

## 3. Data Preparation (Preparación de los datos)
- Limpieza de presión arterial (swap y clipping de `ap_hi`, `ap_lo`).
- Ingeniería de características: `age_years`, `imc`, `pulse_pressure`, `map`.
- Escalado de numéricos y separación train/test.

Artefactos:
- Script de entrenamiento unificado: `backend/ml_models/training/train_pipeline.py` (incluye Pipeline con `ColumnTransformer` + `StandardScaler`).
- Comparador de modelos: `backend/ml_models/training/compare_models_cardio.py`.

## 4. Modeling (Modelado)
- Modelos probados: Regresión logística, Árbol, RandomForest, XGBoost (comparador).
- Modelo en producción: Pipeline `preproc + XGBClassifier`.
- Optimización: `RandomizedSearchCV` con `StratifiedKFold` (AUC como métrica).

Artefactos:
- Entrenamiento con HPO: `backend/ml_models/training/train_pipeline.py`.
- Resultados comparativos y métricas en el notebook.

## 5. Evaluation (Evaluación)
- Validación: 5-fold CV con métricas (accuracy, precision, recall, f1, ROC-AUC).
- Reportes: clasificación y curvas ROC en el notebook.
- Persistencia de mejores hiperparámetros.

Artefactos:
- Notebook: `Cardio_Prediccion_Modelos.ipynb` (tabla comparativa, ROC).
- Parámetros óptimos: `backend/ml_models/trained_models/pipeline_best_params.json`.

## 6. Deployment (Despliegue)
- Artefacto de despliegue: `backend/ml_models/trained_models/pipeline.joblib` (preproceso + modelo en uno).
- Carga en backend: `backend/ml_models/cardiovascular_predictor.py` (usa el pipeline si está presente, con fallback a legado).
- Siguientes pasos: registrar métricas/versión del modelo, monitoreo, y endpoints de evaluación.

## Cómo ejecutar rápido
1) Entrenar y guardar el pipeline con HPO:
   - Ejecutar `backend/ml_models/training/train_pipeline.py` en tu entorno Python.
2) Levantar backend y usar el endpoint de predicción (ya carga `pipeline.joblib`).

Notas
- Requisitos Python en `backend/requirements.txt`. Asegura tener `xgboost` instalado.
- El notebook es opcional para exploración y comparación.
