import { predictionService } from "@/lib/services/predictions"
import { type ProcessedPatient } from "./types"

interface ValidationResult {
  isValid: boolean
  errors: {
    row: number
    errors: string[]
  }[]
  data?: ProcessedPatient[]
}

export async function validateImportData(data: any[]): Promise<ValidationResult> {
  try {
    // Enviar datos al backend para validación
    const response = await fetch('/api/medical-data/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        isValid: false,
        errors: [{
          row: 0,
          errors: [error.message || 'Error en la validación']
        }]
      }
    }

    const result = await response.json()
    
    // Realizar test de predicción con una muestra
    if (result.isValid && result.data?.length > 0) {
      try {
        // Tomar el primer registro para probar la predicción
        const testData = result.data[0]
        await predictionService.predict(testData)
      } catch (err) {
        return {
          isValid: false,
          errors: [{
            row: 0,
            errors: ['Error en la prueba de predicción. Verifique el formato de los datos.']
          }]
        }
      }
    }

    return result
  } catch (err) {
    return {
      isValid: false,
      errors: [{
        row: 0,
        errors: ['Error en la validación de datos']
      }]
    }
  }
}
