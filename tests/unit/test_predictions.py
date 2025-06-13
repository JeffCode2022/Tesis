from django.test import TestCase
from apps.predictions.models import Prediction
from apps.medical_data.models import MedicalRecord
from ml_models.cardiovascular_predictor import CardiovascularPredictor

class PredictionModelTests(TestCase):
    def setUp(self):
        self.predictor = CardiovascularPredictor()
        
    def test_prediction_creation(self):
        """Test que verifica la creación de una predicción"""
        prediction = Prediction.objects.create(
            patient_id=1,
            risk_score=0.75,
            risk_level='alto',
            confidence_score=0.85
        )
        self.assertEqual(prediction.risk_level, 'alto')
        self.assertEqual(prediction.risk_score, 0.75)
        
    def test_predictor_initialization(self):
        """Test que verifica la inicialización del predictor"""
        self.assertIsNotNone(self.predictor)
        self.assertTrue(hasattr(self.predictor, 'predict'))
        
    def test_risk_level_calculation(self):
        """Test que verifica el cálculo del nivel de riesgo"""
        risk_level = self.predictor._calculate_risk_level(85)
        self.assertEqual(risk_level, 'alto')
        
        risk_level = self.predictor._calculate_risk_level(45)
        self.assertEqual(risk_level, 'moderado')
        
        risk_level = self.predictor._calculate_risk_level(15)
        self.assertEqual(risk_level, 'bajo') 