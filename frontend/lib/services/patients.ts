import { api } from './api';

export interface Patient {
  id: string;
  nombre: string;
  apellidos: string;
  edad: number;
  sexo: string;
  peso: number;
  altura: number;
  riesgo: string;
  numero_historia: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  presion_sistolica: number;
  presion_diastolica: number;
  colesterol: number;
  glucosa: number;
  cigarrillos_dia: number;
  anos_tabaquismo: number;
  actividad_fisica: string;
  antecedentes_cardiacos: string;
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
      if (Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.warn('API returned non-array data for patients. Returning empty array.', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      throw new Error('Error al obtener la lista de pacientes.');
    }
  },

  async getPatient(id: string): Promise<Patient> {
    try {
    const response = await api.get<Patient>(`/api/patients/${id}/`);
    return response.data;
    } catch (error) {
      console.error('Error obteniendo paciente:', error);
      throw new Error('Error al obtener el paciente solicitado.');
    }
  },

  async createPatient(data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>): Promise<Patient> {
    try {
    const response = await api.post<Patient>('/api/patients/', data);
    return response.data;
    } catch (error) {
      console.error('Error creando paciente:', error);
      throw new Error('Error al crear el paciente.');
    }
  },

  async updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>>): Promise<Patient> {
    try {
    const response = await api.patch<Patient>(`/api/patients/${id}/`, data);
    return response.data;
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      throw new Error('Error al actualizar el paciente.');
    }
  },

  async deletePatient(id: string): Promise<void> {
    try {
    await api.delete(`/api/patients/${id}/`);
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      throw new Error('Error al eliminar el paciente.');
    }
  },

  async createOrUpdate(data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'riesgo'>): Promise<Patient> {
    try {
      // Buscar paciente por nombre
      const patients = await this.getPatients();
      const existingPatient = patients.find(p => (p.nombre || '').toLowerCase() === data.nombre.toLowerCase());

      if (existingPatient) {
        // Actualizar paciente existente
        return await this.updatePatient(existingPatient.id, data);
      } else {
        // Crear nuevo paciente
        return await this.createPatient(data);
      }
    } catch (error) {
      console.error('Error en createOrUpdate:', error);
      throw new Error('Error al crear o actualizar el paciente.');
    }
  },

  async createMedicalRecord(patientId: string, data: Omit<MedicalRecord, 'id' | 'patient_id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> {
    try {
      const response = await api.post<MedicalRecord>(`/api/patients/${patientId}/add_medical_record/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creando registro médico:', error);
      throw new Error('Error al crear el registro médico.');
    }
  }
}; 