// Tipos para el módulo de importación
export interface ProcessedPatient {
  nombre: string
  apellidos: string
  dni: string
  fecha_nacimiento: string
  sexo: string
  peso: string
  altura: string
  presion_sistolica: string
  presion_diastolica: string
  frecuencia_cardiaca: string
  colesterol: string
  colesterol_hdl: string
  colesterol_ldl: string
  trigliceridos: string
  glucosa: string
  hemoglobina_glicosilada: string
  cigarrillos_dia: string
  anos_tabaquismo: string
  actividad_fisica: string
  antecedentes_cardiacos: string
  diabetes: string
  hipertension: string
  numero_historia: string
}

export interface ValidationError {
  patientId: string
  dni: string
  nombre: string
  errores: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
