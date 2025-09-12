import axios from 'axios';
import { api } from './api';
import { patientService } from './patients';
import { authService } from './auth';

export interface PredictionData {
  id?: string; // UUID opcional
  nombre: string;
  apellidos: string;
  dni: string; // Añadido campo DNI
  fecha_nacimiento: string;
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
  riesgo_nivel: string; // Nivel de riesgo (Bajo, Medio, Alto)
  probabilidad: number; // Porcentaje de riesgo (0-100)
  factores_riesgo: string[]; // Factores de riesgo identificados
  recomendaciones: string[]; // Recomendaciones personalizadas
  updated_at: string; // Fecha de actualización
  patient_id: string; // UUID del paciente
  medical_record_id: string | null; // UUID del registro médico (opcional)
  // Campos adicionales que podrían venir del backend
  factores?: string[]; // Mantener por compatibilidad
  riesgo?: string; // Mantener por compatibilidad
}

export const predictionService = {
  async predict(data: PredictionData): Promise<PredictionResult> {
    try {
      console.log('[predictionService.predict] Datos recibidos:', data);
      console.log('[predictionService.predict] Tipos de datos:', {
        nombre: typeof data.nombre,
        apellidos: typeof data.apellidos,
        dni: typeof data.dni,
        fecha_nacimiento: typeof data.fecha_nacimiento,
        sexo: typeof data.sexo,
        peso: typeof data.peso,
        altura: typeof data.altura,
        presionSistolica: typeof data.presionSistolica,
        presionDiastolica: typeof data.presionDiastolica,
        colesterol: typeof data.colesterol,
        glucosa: typeof data.glucosa,
        cigarrillosDia: typeof data.cigarrillosDia,
        anosTabaquismo: typeof data.anosTabaquismo,
        actividadFisica: typeof data.actividadFisica,
        antecedentesCardiacos: typeof data.antecedentesCardiacos,
        numero_historia: typeof data.numero_historia
      });
      
      // Obtener el usuario actual para asignar como médico tratante
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado. Debe iniciar sesión para realizar predicciones.');
      }
      
      // Primero, crear o actualizar el paciente
      const patient = await patientService.createOrUpdate({
        nombre: data.nombre,
        apellidos: data.apellidos,
        dni: data.dni,
        fecha_nacimiento: data.fecha_nacimiento,
        sexo: data.sexo,
        peso: data.peso,
        altura: data.altura,
        numero_historia: data.numero_historia,
        medico_tratante: currentUser.id,
        // Campos requeridos por la interfaz Patient para evitar errores de tipo
        riesgo_actual: null,
        ultimo_registro: new Date().toISOString(),
      });

      console.log('[predictionService.predict] Paciente creado/actualizado:', patient);

      // Crear o actualizar el registro médico
      const medicalRecordData = {
        presion_sistolica: data.presionSistolica,
        presion_diastolica: data.presionDiastolica,
        colesterol: data.colesterol,
        glucosa: data.glucosa,
        cigarrillos_dia: data.cigarrillosDia,
        anos_tabaquismo: data.anosTabaquismo,
        actividad_fisica: data.actividadFisica,
        antecedentes_cardiacos: data.antecedentesCardiacos
      };
      
      console.log(`[predictionService] Datos a enviar al registro médico:`, medicalRecordData);
      
      const medicalRecord = await patientService.createOrUpdateMedicalRecord(patient.id, medicalRecordData);

      console.log('[predictionService.predict] Registro médico creado/actualizado:', medicalRecord);

      // Realizar la predicción
      console.log(`[predictionService] Enviando predicción con:`, {
        patient_id: patient.id,
        medical_record_id: medicalRecord.id
      });
      
      console.log(`[predictionService] Datos del registro médico:`, {
        id: medicalRecord.id,
        presion_sistolica: medicalRecord.presion_sistolica,
        presion_diastolica: medicalRecord.presion_diastolica,
        colesterol: medicalRecord.colesterol,
        glucosa: medicalRecord.glucosa,
        cigarrillos_dia: medicalRecord.cigarrillos_dia,
        anos_tabaquismo: medicalRecord.anos_tabaquismo,
        actividad_fisica: medicalRecord.actividad_fisica,
        antecedentes_cardiacos: medicalRecord.antecedentes_cardiacos
      });
      
      const payload = {
        // Datos del paciente
        dni: patient.dni,
        nombre: patient.nombre,
        apellidos: patient.apellidos,
        fecha_nacimiento: patient.fecha_nacimiento,
        sexo: patient.sexo,
        peso: patient.peso,
        altura: patient.altura,
        numero_historia: patient.numero_historia,
        // Datos del registro médico
        presion_sistolica: data.presionSistolica,
        presion_diastolica: data.presionDiastolica,
        colesterol: data.colesterol,
        glucosa: data.glucosa,
        cigarrillos_dia: data.cigarrillosDia,
        anos_tabaquismo: data.anosTabaquismo,
        actividad_fisica: data.actividadFisica,
        antecedentes_cardiacos: data.antecedentesCardiacos
      };
      console.log('[predictionService] Payload enviado al backend:', payload);
      const response = await api.post<PredictionResult>('/api/predictions/predictions/predict/', payload);
      
      console.log("[predictionService] Respuesta completa del backend:", response);
      console.log("[predictionService] Datos de la predicción:", response.data);
      console.log("[predictionService] Campo riesgo_nivel:", response.data.riesgo_nivel);
      console.log("[predictionService] Campo probabilidad:", response.data.probabilidad);
      console.log("[predictionService] Campo factores:", response.data.factores);
      console.log("[predictionService] Campo recomendaciones:", response.data.recomendaciones);
      
      return response.data;
    } catch (error) {
      console.error('[predictionService.predict] Error completo:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[predictionService.predict] Status:', error.response.status);
        console.error('[predictionService.predict] Data del error:', error.response.data);
        console.error('[predictionService.predict] Headers:', error.response.headers);
        // Re-lanzar un error más específico si está disponible
        const errorMessage = error.response.data?.error || 'Error al realizar la predicción. Por favor, intente nuevamente.';
        throw new Error(errorMessage);
      }
      throw new Error('Error al realizar la predicción. Por favor, intente nuevamente.');
    }
  },

  async getPredictionHistory(): Promise<PredictionResult[]> {
    try {
      const response = await api.get<PredictionResult[]>('/api/predictions/predictions/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.detail || 'Error al obtener el historial de predicciones.';
        throw new Error(errorMessage);
      }
      throw new Error('Error al obtener el historial de predicciones.');
    }
  },

  async getPredictionById(id: string): Promise<PredictionResult> {
    try {
      const response = await api.get<PredictionResult>(`/api/predictions/predictions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo predicción:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.detail || 'Error al obtener la predicción solicitada.';
        throw new Error(errorMessage);
      }
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