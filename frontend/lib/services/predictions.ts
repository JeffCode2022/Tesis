import { api } from './api';
import { patientService } from './patients';

export interface PredictionData {
  id?: string; // UUID opcional
  nombre: string;
  apellidos: string;
  dni: string; // Añadido campo DNI
  edad: number;
  sexo: string;
  peso: number;
  altura: number;
  presionSistolica: number;
  presionDiastolica: number;
  colesterol: number;
  glucosa: number;
  cigarrillosDia: number;
  anosTabaquismo: number;
  actividadFisica: string;
  antecedentesCardiacos: string;
  numero_historia: string;
}

export interface PredictionResult {
  id: string; // UUID
  riesgo: string;
  probabilidad: number;
  factores: string[];
  recomendaciones: string[];
  updated_at: string;
  patient_id: string; // UUID
  medical_record_id: string | null; // UUID opcional
}

export const predictionService = {
  async predict(data: PredictionData): Promise<PredictionResult> {
    try {
      // Primero, crear o actualizar el paciente
      const patient = await patientService.createOrUpdate({
        nombre: data.nombre,
        apellidos: data.apellidos,
        dni: data.dni,
        edad: data.edad,
        sexo: data.sexo,
        peso: data.peso,
        altura: data.altura,
        numero_historia: data.numero_historia,
      });

      // Crear el registro médico
      const medicalRecord = await patientService.createMedicalRecord(patient.id, {
        presion_sistolica: data.presionSistolica,
        presion_diastolica: data.presionDiastolica,
        colesterol: data.colesterol,
        glucosa: data.glucosa,
        cigarrillos_dia: data.cigarrillosDia,
        anos_tabaquismo: data.anosTabaquismo,
        actividad_fisica: data.actividadFisica,
        antecedentes_cardiacos: data.antecedentesCardiacos
      });

      // Realizar la predicción
      const response = await api.post<PredictionResult>('/api/predictions/predictions/predict/', {
        patient_id: patient.id,
        medical_record_id: medicalRecord.id
      });

      return response.data;
    } catch (error) {
      console.error('Error en predicción:', error);
      throw new Error('Error al realizar la predicción. Por favor, intente nuevamente.');
    }
  },

  async getPredictionHistory(): Promise<PredictionResult[]> {
    try {
      const response = await api.get<PredictionResult[]>('/api/predictions/predictions/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw new Error('Error al obtener el historial de predicciones.');
    }
  },

  async getPredictionById(id: string): Promise<PredictionResult> {
    try {
      const response = await api.get<PredictionResult>(`/api/predictions/predictions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo predicción:', error);
      throw new Error('Error al obtener la predicción solicitada.');
    }
  },

  async getLatestPredictionForPatient(patientId: string): Promise<PredictionResult | null> {
    try {
      // Asume que el backend puede filtrar por patient_id y ordenar por fecha para obtener la última
      const response = await api.get<PredictionResult[]>(`/api/predictions/predictions/?patient=${patientId}&limit=1&order_by=-created_at`);
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error: any) {
      console.error(`Error obteniendo la última predicción para el paciente ${patientId}:`, error.message || error);
      // Si hay un error (ej. 404 si no hay predicciones), simplemente retorna null
      return null;
    }
  }
}; 