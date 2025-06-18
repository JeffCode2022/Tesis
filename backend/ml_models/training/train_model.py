import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from django.conf import settings
import logging

logger = logging.getLogger('ml_models')

class CardiovascularModelTrainer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = [
            'edad', 'imc', 'presion_sistolica', 'presion_diastolica',
            'colesterol', 'glucosa', 'indice_paquetes', 'actividad_fisica_encoded',
            'sexo_encoded', 'antecedentes_encoded'
        ]
    
    def load_data(self, data_path=None):
        """Cargar datos de entrenamiento"""
        if data_path:
            df = pd.read_csv(data_path)
        else:
            # Generar datos sintéticos para demostración
            df = self._generate_synthetic_data()
        
        logger.info(f"Datos cargados: {len(df)} registros")
        return df
    
    def _generate_synthetic_data(self, n_samples=5000):
        """Generar datos sintéticos para entrenamiento"""
        np.random.seed(42)
        
        data = {
            'edad': np.random.normal(50, 15, n_samples).astype(int),
            'peso': np.random.normal(75, 15, n_samples),
            'altura': np.random.normal(170, 10, n_samples),
            'presion_sistolica': np.random.normal(130, 20, n_samples).astype(int),
            'presion_diastolica': np.random.normal(85, 15, n_samples).astype(int),
            'colesterol': np.random.normal(200, 40, n_samples),
            'glucosa': np.random.normal(100, 25, n_samples),
            'cigarrillos_dia': np.random.poisson(5, n_samples),
            'anos_tabaquismo': np.random.poisson(10, n_samples),
            'sexo': np.random.choice(['M', 'F'], n_samples),
            'actividad_fisica': np.random.choice(['sedentario', 'ligero', 'moderado', 'intenso'], n_samples),
            'antecedentes_cardiacos': np.random.choice(['si', 'no'], n_samples, p=[0.3, 0.7])
        }
        
        df = pd.DataFrame(data)
        
        # Calcular IMC
        df['imc'] = df['peso'] / (df['altura'] / 100) ** 2
        
        # Calcular índice de paquetes/año
        df['indice_paquetes'] = (df['cigarrillos_dia'] / 20) * df['anos_tabaquismo']
        
        # Generar variable objetivo basada en factores de riesgo
        df['riesgo_cardiovascular'] = self._calculate_synthetic_risk(df)
        
        # Limpiar datos
        df['edad'] = np.clip(df['edad'], 18, 100)
        df['presion_sistolica'] = np.clip(df['presion_sistolica'], 80, 200)
        df['presion_diastolica'] = np.clip(df['presion_diastolica'], 50, 120)
        df['colesterol'] = np.clip(df['colesterol'], 100, 400)
        df['glucosa'] = np.clip(df['glucosa'], 70, 300)
        
        return df
    
    def _calculate_synthetic_risk(self, df):
        """Calcular riesgo sintético basado en factores conocidos y devolver 3 clases: 0 (bajo), 1 (medio), 2 (alto)"""
        risk_score = np.zeros(len(df))
        
        # Factores de riesgo
        risk_score += (df['edad'] > 65) * 0.3
        risk_score += (df['edad'] > 45) * 0.1
        risk_score += (df['imc'] > 30) * 0.25
        risk_score += (df['imc'] > 25) * 0.1
        risk_score += (df['presion_sistolica'] > 140) * 0.3
        risk_score += (df['presion_sistolica'] > 120) * 0.15
        risk_score += (df['colesterol'] > 240) * 0.2
        risk_score += (df['glucosa'] > 126) * 0.25
        risk_score += (df['indice_paquetes'] > 10) * 0.2
        risk_score += (df['actividad_fisica'] == 'sedentario') * 0.1
        risk_score += (df['antecedentes_cardiacos'] == 'si') * 0.2
        risk_score += (df['sexo'] == 'M') * 0.1
        
        # Añadir ruido
        risk_score += np.random.normal(0, 0.1, len(df))
        
        # Convertir a probabilidad
        probability = 1 / (1 + np.exp(-risk_score))
        
        # Asignar clases: 0 (bajo <0.33), 1 (medio 0.33-0.66), 2 (alto >0.66)
        riesgo = np.zeros(len(df))
        riesgo[probability < 0.33] = 0
        riesgo[(probability >= 0.33) & (probability < 0.66)] = 1
        riesgo[probability >= 0.66] = 2
        return riesgo.astype(int)
    
    def preprocess_data(self, df):
        """Preprocesar datos para entrenamiento"""
        # Calcular IMC si no existe
        if 'imc' not in df.columns:
            df['imc'] = df['peso'] / (df['altura'] / 100) ** 2
        
        # Calcular índice de paquetes/año si no existe
        if 'indice_paquetes' not in df.columns:
            df['indice_paquetes'] = (df['cigarrillos_dia'] / 20) * df['anos_tabaquismo']
        
        # Codificar variables categóricas
        actividad_mapping = {'sedentario': 0, 'ligero': 1, 'moderado': 2, 'intenso': 3}
        df['actividad_fisica_encoded'] = df['actividad_fisica'].map(actividad_mapping)
        
        df['sexo_encoded'] = (df['sexo'] == 'M').astype(int)
        
        antecedentes_mapping = {'si': 1, 'no': 0, 'desconoce': 0.5}
        df['antecedentes_encoded'] = df['antecedentes_cardiacos'].map(antecedentes_mapping)
        
        # Seleccionar features
        X = df[self.feature_names]
        y = df['riesgo_cardiovascular'] if 'riesgo_cardiovascular' in df.columns else None
        
        # Manejar valores faltantes
        X = X.fillna(X.median())
        
        return X, y
    
    def train(self, data_path=None):
        """Entrenar el modelo"""
        logger.info("Iniciando entrenamiento del modelo cardiovascular")
        
        # Cargar y preprocesar datos
        df = self.load_data(data_path)
        X, y = self.preprocess_data(df)
        
        if y is None:
            raise ValueError("No se encontró variable objetivo 'riesgo_cardiovascular'")
        
        # Split de datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Normalización
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Entrenamiento con GridSearch
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        }
        
        rf = RandomForestClassifier(random_state=42, class_weight='balanced')
        grid_search = GridSearchCV(
            rf, param_grid, cv=5, scoring='roc_auc', n_jobs=-1, verbose=1
        )
        
        logger.info("Ejecutando GridSearchCV...")
        grid_search.fit(X_train_scaled, y_train)
        
        self.model = grid_search.best_estimator_
        logger.info(f"Mejores parámetros: {grid_search.best_params_}")
        
        # Evaluación
        self._evaluate_model(X_test_scaled, y_test, X_train_scaled, y_train)
        
        # Guardar modelo
        self._save_model()
        
        logger.info("Entrenamiento completado exitosamente")
        
        return {
            'best_params': grid_search.best_params_,
            'best_score': grid_search.best_score_,
            'test_score': roc_auc_score(y_test, self.model.predict_proba(X_test_scaled)[:, 1])
        }
    
    def _evaluate_model(self, X_test, y_test, X_train, y_train):
        """Evaluar el modelo entrenado"""
        # Predicciones
        y_pred_test = self.model.predict(X_test)
        y_pred_proba_test = self.model.predict_proba(X_test)[:, 1]
        
        y_pred_train = self.model.predict(X_train)
        y_pred_proba_train = self.model.predict_proba(X_train)[:, 1]
        
        # Métricas
        test_auc = roc_auc_score(y_test, y_pred_proba_test)
        train_auc = roc_auc_score(y_train, y_pred_proba_train)
        
        logger.info(f"ROC AUC Test: {test_auc:.4f}")
        logger.info(f"ROC AUC Train: {train_auc:.4f}")
        logger.info(f"Overfitting: {train_auc - test_auc:.4f}")
        
        print("\nReporte de clasificación (Test):")
        print(classification_report(y_test, y_pred_test))
        
        # Importancia de features
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        logger.info("Importancia de features:")
        for _, row in feature_importance.head(10).iterrows():
            logger.info(f"{row['feature']}: {row['importance']:.4f}")
        
        # Guardar métricas en base de datos
        self._save_performance_metrics(test_auc, y_test, y_pred_test)
    
    def _save_performance_metrics(self, roc_auc, y_true, y_pred):
        """Guardar métricas de rendimiento en la base de datos"""
        try:
            from apps.predictions.models import ModelPerformance
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
            
            ModelPerformance.objects.create(
                model_version='v1.2.0',
                accuracy=accuracy_score(y_true, y_pred),
                precision=precision_score(y_true, y_pred),
                recall=recall_score(y_true, y_pred),
                f1_score=f1_score(y_true, y_pred),
                roc_auc=roc_auc,
                total_predictions=len(y_true),
                correct_predictions=np.sum(y_true == y_pred)
            )
            logger.info("Métricas guardadas en base de datos")
        except Exception as e:
            logger.error(f"Error guardando métricas: {e}")
    
    def _save_model(self):
        """Guardar modelo y scaler"""
        try:
            # Si settings.ML_MODELS_PATH no está disponible, usar ruta relativa
            try:
                model_dir = settings.ML_MODELS_PATH
            except Exception:
                import os
                model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../trained_models'))
            os.makedirs(model_dir, exist_ok=True)

            model_path = os.path.join(model_dir, 'cardiovascular_model.joblib')
            scaler_path = os.path.join(model_dir, 'scaler.pkl')

            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)

            print(f"Modelo guardado en: {model_path}")
            print(f"Scaler guardado en: {scaler_path}")

        except Exception as e:
            print(f"Error guardando modelo: {e}")
            raise

if __name__ == "__main__":
    trainer = CardiovascularModelTrainer()
    results = trainer.train()
    print(f"Entrenamiento completado: {results}")
