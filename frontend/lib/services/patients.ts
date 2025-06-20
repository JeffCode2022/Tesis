import { api } from './api';
import { predictionService } from './predictions';

export interface Patient {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  edad: number;
  sexo: string;
  peso: number;
  altura: number;
  imc?: number;
  riesgo_actual: string | null;
  numero_historia: string;
  ultimo_registro: string;
  created_at: string;
  updated_at: string;
  probabilidad?: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  antecedentes_cardiacos?: string;
  medicamentos_actuales?: string;
  nombre_completo?: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  presion_sistolica: number;
  presion_diastolica: number;
  frecuencia_cardiaca?: number;
  colesterol: number;
  colesterol_hdl?: number;
  colesterol_ldl?: number;
  trigliceridos?: number;
  glucosa: number;
  hemoglobina_glicosilada?: number;
  cigarrillos_dia: number;
  anos_tabaquismo: number;
  actividad_fisica: string;
  antecedentes_cardiacos: string;
  diabetes?: boolean;
  hipertension?: boolean;
  medicamentos_actuales?: string;
  alergias?: string;
  observaciones?: string;
  fecha_registro: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPatientsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await api.get<PaginatedPatientsResponse>('/api/patients/');
      return response.data.results || [];
    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      throw error instanceof Error ? error : new Error('Error al obtener la lista de pacientes');
    }
  },

  async getPatient(id: string): Promise<Patient> {
    try {
      const response = await api.get<Patient>(`/api/patients/${id}/`);
      const patientData = response.data;
      
      // Obtener la última predicción para este paciente
      const latestPredictionPromise = predictionService.getLatestPredictionForPatient(id);

      // Obtener el último registro médico para este paciente
      const latestMedicalRecordPromise = this.getLatestMedicalRecordForPatient(id);

      const [latestPrediction, latestMedicalRecord] = await Promise.all([
        latestPredictionPromise,
        latestMedicalRecordPromise
      ]);

      console.log('getPatient - patientData:', patientData);
      console.log('getPatient - latestPrediction:', latestPrediction);
      return {
        ...patientData,
        probabilidad: latestPrediction?.probabilidad ?? patientData.probabilidad,
        riesgo_actual: latestPrediction ?? patientData.riesgo_actual,
        ultimo_registro: latestPrediction?.updated_at ?? latestMedicalRecord?.fecha_registro ?? patientData.ultimo_registro,
        antecedentes_cardiacos: latestMedicalRecord?.antecedentes_cardiacos ?? patientData.antecedentes_cardiacos,
        medicamentos_actuales: latestMedicalRecord?.medicamentos_actuales ?? patientData.medicamentos_actuales,
      };
    } catch (error) {
      console.error('Error obteniendo paciente:', error);
      throw error instanceof Error ? error : new Error('Error al obtener el paciente solicitado');
    }
  },

  async getLatestMedicalRecordForPatient(patientId: string): Promise<MedicalRecord | null> {
    try {
      const response = await api.get<MedicalRecord[]>(`/api/medical-records/?patient=${patientId}&limit=1&order_by=-fecha_registro`);
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error(`Error obteniendo el último registro médico para el paciente ${patientId}:`, error);
      return null;
    }
  },

  async createPatient(data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>): Promise<Patient> {
    try {
      console.log('Datos enviados a createPatient:', data);
      const response = await api.post<Patient>('/api/patients/', data);
      return response.data;
    } catch (error) {
      console.error('Error creando paciente:', error);
      throw error instanceof Error ? error : new Error('Error al crear el paciente');
    }
  },

  async updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>>): Promise<Patient> {
    try {
      const response = await api.patch<Patient>(`/api/patients/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      throw error instanceof Error ? error : new Error('Error al actualizar el paciente');
    }
  },

  async deletePatient(id: string): Promise<void> {
    try {
      await api.delete(`/api/patients/${id}/`);
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      throw error instanceof Error ? error : new Error('Error al eliminar el paciente');
    }
  },

  async createOrUpdate(data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>): Promise<Patient> {
    try {
      const patients = await this.getPatients();
      const existingPatient = patients.find(p => 
        p.dni && data.dni &&
        p.dni.toLowerCase() === data.dni.toLowerCase()
      );

      if (existingPatient) {
        return await this.updatePatient(existingPatient.id, data);
      } else {
        return await this.createPatient(data);
      }
    } catch (error) {
      console.error('Error en createOrUpdate:', error);
      throw error instanceof Error ? error : new Error('Error al crear o actualizar el paciente');
    }
  },

  async createMedicalRecord(patientId: string, data: Omit<MedicalRecord, 'id' | 'patient_id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> {
    try {
      const response = await api.post<MedicalRecord>(`/api/patients/${patientId}/add_medical_record/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creando registro médico:', error);
      throw error instanceof Error ? error : new Error('Error al crear el registro médico');
    }
  },

  async getPatientByDni(dni: string): Promise<Patient[]> {
    try {
      const response = await api.get<PaginatedPatientsResponse>(`/api/patients/?dni=${dni}`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error buscando paciente por DNI:', error);
      return [];
    }
  },
}; 