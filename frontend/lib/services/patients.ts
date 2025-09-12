import { api } from './api';
import { predictionService } from './predictions';

export interface Patient {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento?: string;
  sexo: string;
  peso: number;
  altura: number;
  imc?: number;
  riesgo_actual: string | null; // Nivel de riesgo como string
  ultima_prediccion?: any; // Objeto completo de la última predicción
  numero_historia: string;
  ultimo_registro: string;
  created_at: string;
  updated_at: string;
  probabilidad?: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  hospital?: string;
  medico_tratante?: string;
  external_patient_id?: string;
  external_system_data?: any;
  is_active?: boolean;
  nombre_completo?: string;
}

export interface MedicalRecord {
  id: string;
  patient: string;
  presion_sistolica: number;
  presion_diastolica: number;
  frecuencia_cardiaca?: number;
  colesterol?: number;
  colesterol_hdl?: number;
  colesterol_ldl?: number;
  trigliceridos?: number;
  glucosa?: number;
  hemoglobina_glicosilada?: number;
  cigarrillos_dia: number;
  anos_tabaquismo: number;
  actividad_fisica: string;
  antecedentes_cardiacos: string;
  diabetes?: boolean;
  hipertension?: boolean;
  medicamentos_actuales?: any[];
  alergias?: any[];
  observaciones?: string;
  external_record_id?: string;
  external_data?: any;
  fecha_registro: string;
  created_at: string;
  presion_arterial?: string;
  indice_paquetes_ano?: number;
  riesgo_diabetes?: string;
}

export interface PaginatedPatientsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

export const patientService = {
  async getPatientByDniV2(dni: string): Promise<any> {
    try {
      const response = await api.post('/api/patients/search_by_dni/', { dni });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        return { error: error.response.data.error };
      }
      return { error: 'Error inesperado al buscar paciente por DNI.' };
    }
  },
  async getPatients(page: number = 1, pageSize: number = 50, search?: string): Promise<{ patients: Patient[], total: number, totalPages: number }> {
    try {
      let url = `/api/patients/?page=${page}&page_size=${pageSize}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      console.log(`[patientService] Solicitando: ${url}`)

      const response = await api.get<PaginatedPatientsResponse>(url)

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor')
      }

      const patients = response.data.results || []
      const total = response.data.count || 0
      const totalPages = Math.ceil(total / pageSize)

      console.log(`[patientService] Página ${page}: ${patients.length} pacientes de ${total} totales`)
      return { patients, total, totalPages }
    } catch (error: any) {
      console.error('[patientService] Error obteniendo pacientes:', error)

      // Si es un error de red o timeout
      if (error.isNetworkError) {
        throw new Error('Sin conexión al servidor. Verifica tu conexión a internet.')
      }

      if (error.isTimeout) {
        throw new Error('La solicitud tardó demasiado. Inténtalo de nuevo.')
      }

      // Si es un error HTTP específico
      if (error.response?.status === 404) {
        throw new Error('El endpoint de pacientes no está disponible.')
      }

      if (error.response?.status === 500) {
        throw new Error('Error del servidor. Inténtalo más tarde.')
      }

      // Error genérico
      throw error instanceof Error ? error : new Error('Error al obtener la lista de pacientes')
    }
  },

  // Método para obtener todos los pacientes en una sola petición
  async getAllPatients(): Promise<Patient[]> {
    try {
      // Usar el nuevo parámetro que deshabilita la paginación en el backend
      const response = await api.get<Patient[]>('/api/patients/?no_pagination=true');
      const allPatients = response.data || [];

      console.log(`[patientService] Obtenidos ${allPatients.length} pacientes totales en una sola petición.`);
      return allPatients;
    } catch (error) {
      console.error('Error obteniendo todos los pacientes:', error);
      throw error instanceof Error ? error : new Error('Error al obtener la lista completa de pacientes');
    }
  },

  async getAllPatientsForPrediction(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/api/patients/for-prediction/');
      console.log(`[patientService] Obtenidos ${response.data.length} pacientes listos para predicción.`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo pacientes para predicción:', error);
      throw error instanceof Error ? error : new Error('Error al preparar los datos para la predicción masiva');
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

      // Función helper para extraer el nivel de riesgo
      const extractRiskLevel = (riskData: any): string | null => {
        if (!riskData) return null;

        // Si es un string, devolverlo directamente
        if (typeof riskData === 'string') return riskData;

        // Si es un objeto, buscar el campo riesgo_nivel
        if (typeof riskData === 'object' && riskData.riesgo_nivel) {
          return riskData.riesgo_nivel;
        }

        return null;
      };

      console.log('getPatient - patientData:', patientData);
      console.log('getPatient - latestPrediction:', latestPrediction);
      console.log('getPatient - riesgo_actual original:', patientData.riesgo_actual);

      const riesgoActual = extractRiskLevel(patientData.riesgo_actual);
      const riesgoFromPrediction = extractRiskLevel(latestPrediction);

      console.log('getPatient - riesgo_actual extraído:', riesgoActual);
      console.log('getPatient - riesgo de predicción:', riesgoFromPrediction);

      return {
        ...patientData,
        probabilidad: latestPrediction?.probabilidad ?? patientData.probabilidad,
        riesgo_actual: riesgoFromPrediction ?? riesgoActual,
        ultima_prediccion: latestPrediction, // Asignar la predicción completa
        ultimo_registro: latestPrediction?.updated_at ?? latestMedicalRecord?.fecha_registro ?? patientData.ultimo_registro,
      };
    } catch (error) {
      console.error('Error obteniendo paciente:', error);
      throw error instanceof Error ? error : new Error('Error al obtener el paciente solicitado');
    }
  },

  async getLatestMedicalRecordForPatient(patientId: string): Promise<MedicalRecord | null> {
    try {
      console.log(`[getLatestMedicalRecordForPatient] Buscando registros médicos para paciente: ${patientId}`);
      // Usar el endpoint del historial médico del paciente que ya existe
      const response = await api.get<{
        patient_id: string;
        patient_name: string;
        medical_records: MedicalRecord[];
        total_records: number;
      }>(`/api/patients/${patientId}/medical_history/`);
      console.log(`[getLatestMedicalRecordForPatient] Respuesta:`, response.data);
      console.log(`[getLatestMedicalRecordForPatient] Cantidad de registros encontrados:`, response.data.medical_records?.length || 0);
      // Retornar el registro más reciente (el primero del array medical_records)
      return response.data.medical_records && response.data.medical_records.length > 0
        ? response.data.medical_records[0]
        : null;
    } catch (error) {
      console.error(`Error obteniendo el último registro médico para el paciente ${patientId}:`, error);
      return null;
    }
  },

  async getPatientCompleteInfo(dni: string): Promise<{
    patient: Patient;
    medicalRecord: MedicalRecord | null;
    medicalHistory: MedicalRecord[];
  } | null> {
    try {
      console.log(`[getPatientCompleteInfo] Obteniendo información completa del paciente con DNI: ${dni}`);
      
      // Primero buscar el paciente por DNI
      const patients = await this.getPatientByDni(dni);
      if (patients.length === 0) {
        console.log(`[getPatientCompleteInfo] No se encontró paciente con DNI: ${dni}`);
        return null;
      }
      
      const patient = patients[0];
      console.log(`[getPatientCompleteInfo] Paciente encontrado:`, patient);
      
      // Obtener el registro médico más reciente
      const latestMedicalRecord = await this.getLatestMedicalRecordForPatient(patient.id);
      console.log(`[getPatientCompleteInfo] Registro médico más reciente:`, latestMedicalRecord);
      
      // Obtener historial médico completo
      const medicalHistoryResponse = await api.get<{
        patient_id: string;
        patient_name: string;
        medical_records: MedicalRecord[];
        total_records: number;
      }>(`/api/patients/${patient.id}/medical_history/`);
      const medicalHistory = medicalHistoryResponse.data.medical_records || [];
      console.log(`[getPatientCompleteInfo] Historial médico completo (${medicalHistory.length} registros)`);
      
      return {
        patient,
        medicalRecord: latestMedicalRecord,
        medicalHistory
      };
    } catch (error) {
      console.error(`[getPatientCompleteInfo] Error obteniendo información completa del paciente ${dni}:`, error);
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
      console.log('[patientService.updatePatient] Actualizando paciente ID:', id);
      console.log('[patientService.updatePatient] Datos a enviar:', data);
      console.log('[patientService.updatePatient] Tipo de datos:', typeof data);

      const response = await api.patch<Patient>(`/api/patients/${id}/`, data);
      console.log('[patientService.updatePatient] Respuesta exitosa:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[patientService.updatePatient] Error completo:', error);
      if (error && typeof error === 'object' && 'response' in error && error.response) {
        console.error('[patientService.updatePatient] Status:', error.response.status);
        if ('headers' in error.response) {
          console.error('[patientService.updatePatient] Headers:', error.response.headers);
        }
        if ('data' in error.response) {
          console.error('[patientService.updatePatient] Data del error:', error.response.data);
        }
      }
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
      console.log('[patientService.createOrUpdate] Iniciando createOrUpdate con DNI:', data.dni);
      console.log('[patientService.createOrUpdate] Datos completos:', data);

      // Usar getPatientByDni para ser más eficiente
      const existingPatients = await this.getPatientByDni(data.dni);
      console.log('[patientService.createOrUpdate] Pacientes existentes encontrados:', existingPatients.length);

      // Nueva lógica: usa getPatientByDniV2 para evitar problemas con duplicados
      const result = await this.getPatientByDniV2(data.dni);
      if (result.error) {
        // Si hay error, significa que el paciente no existe, crear uno nuevo
        console.log(`[createOrUpdate] No se encontró paciente con DNI ${data.dni}. Creando nuevo paciente.`);
        // Validar campos obligatorios antes de crear
        const requiredFields = ['dni', 'nombre', 'apellidos', 'fecha_nacimiento', 'sexo'];
        for (const field of requiredFields) {
          if (!(data as any)[field]) {
            throw new Error(`El campo obligatorio "${field}" falta o está vacío.`);
          }
        }
        return await this.createPatient(data);
      } else {
        // Si no hay error, significa que el paciente existe, actualizar
        const patientToUpdate = result;
        console.log(`[createOrUpdate] Paciente existente encontrado con DNI ${data.dni}. Actualizando ID: ${patientToUpdate.id}`);
        return await this.updatePatient(patientToUpdate.id, data);
      }
    } catch (error: any) {
      console.error('[patientService.createOrUpdate] Error completo:', error);
      if (error && typeof error === 'object' && 'response' in error && error.response) {
        console.error('[patientService.createOrUpdate] Status:', error.response.status);
        if ('data' in error.response) {
          console.error('[patientService.createOrUpdate] Data del error:', error.response.data);
        }
      }
      throw error instanceof Error ? error : new Error('Error al crear o actualizar el paciente');
    }
  },

  async createMedicalRecord(patientId: string, data: Omit<MedicalRecord, 'id' | 'patient' | 'created_at' | 'fecha_registro' | 'presion_arterial' | 'indice_paquetes_ano' | 'riesgo_diabetes'>): Promise<MedicalRecord> {
    try {
      const response = await api.post<MedicalRecord>(`/api/patients/${patientId}/add_medical_record/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creando registro médico:', error);
      throw error instanceof Error ? error : new Error('Error al crear el registro médico');
    }
  },

  async updateMedicalRecord(recordId: string, data: Partial<Omit<MedicalRecord, 'id' | 'patient' | 'created_at' | 'fecha_registro' | 'presion_arterial' | 'indice_paquetes_ano' | 'riesgo_diabetes'>>, patientId?: string): Promise<MedicalRecord> {
    try {
      console.log(`[updateMedicalRecord] Actualizando registro ${recordId} con datos:`, data);

      // Usar la ruta base para registros médicos
      const url = `/api/patients/medical-records/${recordId}/`;

      // Crear una copia de los datos sin el campo patient, ya que es de solo lectura
      const { patient, ...updateData } = data as any;

      console.log(`[updateMedicalRecord] URL de la petición:`, url);
      console.log(`[updateMedicalRecord] Datos a enviar:`, updateData);

      const response = await api.patch<MedicalRecord>(url, updateData);

      console.log(`[updateMedicalRecord] Respuesta:`, response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error actualizando registro médico:', error);

      // Log detallado del error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('[updateMedicalRecord] Error completo:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          requestData: axiosError.config?.data
        });
      }

      // Manejo de errores tipado de manera segura
      if (error && typeof error === 'object') {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: any;
            [key: string]: any;
          };
          [key: string]: any;
        };

        if (axiosError.response) {
          console.error('[updateMedicalRecord] Status:', axiosError.response.status);
          if (axiosError.response.data) {
            // Log detallado del error del backend
            console.error('[updateMedicalRecord] Data del error:', axiosError.response.data);
          }
        }
      }

      throw error instanceof Error ? error : new Error('Error al actualizar el registro médico');
    }
  },

  async getPatientByDni(dni: string): Promise<Patient[]> {
    try {
      const response = await api.get<PaginatedPatientsResponse>('/api/patients/', {
        params: { search: dni, page_size: 1 }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error al buscar paciente por DNI:', error);
      return [];
    }
  },

  async createOrUpdateMedicalRecord(patientId: string, data: Omit<MedicalRecord, 'id' | 'patient' | 'created_at' | 'fecha_registro' | 'presion_arterial' | 'indice_paquetes_ano' | 'riesgo_diabetes'>): Promise<MedicalRecord> {
    try {
      console.log('[createOrUpdateMedicalRecord] Datos recibidos:', data);

      // Definir el tipo para los campos requeridos
      type RequiredFields = 'presion_sistolica' | 'presion_diastolica' | 'cigarrillos_dia' | 'anos_tabaquismo' | 'actividad_fisica' | 'antecedentes_cardiacos';

      // Validar campos obligatorios
      const requiredFields: RequiredFields[] = [
        'presion_sistolica',
        'presion_diastolica',
        'cigarrillos_dia',
        'anos_tabaquismo',
        'actividad_fisica',
        'antecedentes_cardiacos'
      ];

      const missingFields = requiredFields.filter(field =>
        data[field] === undefined || data[field] === null || data[field] === ''
      ) as string[];

      if (missingFields.length > 0) {
        throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      }

      // Crear un tipo seguro para los datos procesados
      type ProcessedData = Omit<MedicalRecord, 'id' | 'patient' | 'created_at' | 'fecha_registro' | 'presion_arterial' | 'indice_paquetes_ano' | 'riesgo_diabetes'> & {
        presion_sistolica: number;
        presion_diastolica: number;
        cigarrillos_dia: number;
        anos_tabaquismo: number;
        actividad_fisica: string;
        antecedentes_cardiacos: string;
      };

      // Asegurar que los valores numéricos sean números
      const processedData: ProcessedData = {
        ...data,
        presion_sistolica: Number(data.presion_sistolica),
        presion_diastolica: Number(data.presion_diastolica),
        cigarrillos_dia: Number(data.cigarrillos_dia),
        anos_tabaquismo: Number(data.anos_tabaquismo),
        actividad_fisica: data.actividad_fisica,
        antecedentes_cardiacos: data.antecedentes_cardiacos,
        // Proporcionar valores por defecto para campos opcionales
        colesterol: data.colesterol ? Number(data.colesterol) : undefined,
        glucosa: data.glucosa ? Number(data.glucosa) : undefined,
        frecuencia_cardiaca: data.frecuencia_cardiaca ? Number(data.frecuencia_cardiaca) : undefined,
        colesterol_hdl: data.colesterol_hdl ? Number(data.colesterol_hdl) : undefined,
        colesterol_ldl: data.colesterol_ldl ? Number(data.colesterol_ldl) : undefined,
        trigliceridos: data.trigliceridos ? Number(data.trigliceridos) : undefined,
        hemoglobina_glicosilada: data.hemoglobina_glicosilada ? Number(data.hemoglobina_glicosilada) : undefined,
        diabetes: data.diabetes || false,
        hipertension: data.hipertension || false,
        medicamentos_actuales: data.medicamentos_actuales || [],
        alergias: data.alergias || [],
        observaciones: data.observaciones || ''
      };

      console.log('[createOrUpdateMedicalRecord] Datos procesados:', processedData);

      // Buscar el registro médico más reciente del paciente
      const latestRecord = await this.getLatestMedicalRecordForPatient(patientId);

      if (latestRecord) {
        // Si existe un registro reciente (menos de 1 hora), actualizarlo con los nuevos datos
        const recordDate = new Date(latestRecord.fecha_registro);
        const now = new Date();
        const hoursDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 1) {
          console.log(`[createOrUpdateMedicalRecord] Actualizando registro médico existente ID: ${latestRecord.id} (${hoursDiff.toFixed(2)} horas de antigüedad)`);
          return await this.updateMedicalRecord(latestRecord.id, processedData, patientId);
        }
      }

      // Si no hay registro reciente o es muy antiguo, crear uno nuevo
      console.log(`[createOrUpdateMedicalRecord] Creando nuevo registro médico para paciente ID: ${patientId}`);
      return await this.createMedicalRecord(patientId, processedData);
    } catch (error) {
      console.error('Error en createOrUpdateMedicalRecord:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
        if ('stack' in error) {
          console.error('Stack trace:', error.stack);
        }
      }
      throw error instanceof Error ? error : new Error('Error al crear o actualizar el registro médico');
    }
  },
};