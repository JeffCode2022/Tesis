// Tipos
interface ValidationResponse {
  isValid: boolean
  errors?: Array<{
    field: string
    message: string
  }>
  testResult?: {
    success: boolean
    message: string
  }
}

// Función para validar datos con el backend
export async function validatePatientData(data: any[]): Promise<ValidationResponse> {
  try {
    console.log('[validatePatientData] Iniciando validación para', data.length, 'pacientes')
    console.log('[validatePatientData] Datos enviados:', data[0])

    // Asegurar que la URL siempre tenga la barra final
    const baseUrl = '/api/medical-records/validation/validate/'
    const validationUrl = baseUrl

    console.log('[validatePatientData] URL de validación:', validationUrl)

    // Validación de estructura y formato
    const validationResponse = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data })
    });

    console.log('[validatePatientData] Respuesta del servidor:', validationResponse.status, validationResponse.statusText)
    console.log('[validatePatientData] URL real usada:', validationResponse.url)

    if (!validationResponse.ok) {
      console.log('[validatePatientData] Error en respuesta:', validationResponse.status)
      // Mejorar el manejo de errores para respuestas no-JSON
      const contentType = validationResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await validationResponse.json();
        console.log('[validatePatientData] Error JSON:', errorData)
        throw new Error(errorData.message || `Error HTTP ${validationResponse.status}`);
      } else {
        const errorText = await validationResponse.text();
        console.log('[validatePatientData] Error text:', errorText)
        throw new Error(`Error del servidor: ${validationResponse.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const validationResult = await validationResponse.json();
    console.log('[validatePatientData] Resultado de validación recibido:', validationResult)

    // Si la validación es exitosa y hay datos, realizar prueba de predicción
    if (validationResult.isValid && data.length > 0) {
      const testResponse = await fetch('/api/medical-records/validation/test_prediction/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient: data[0] })
      });

      if (!testResponse.ok) {
        const contentType = testResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await testResponse.json();
          return {
            isValid: false,
            errors: [{
              field: 'test',
              message: errorData.message || 'Error en la prueba de predicción'
            }]
          };
        } else {
          return {
            isValid: false,
            errors: [{
              field: 'test',
              message: `Error en la prueba de predicción: ${testResponse.status}`
            }]
          };
        }
      }

      const testResult = await testResponse.json();
      return {
        isValid: true,
        testResult: {
          success: true,
          message: 'Prueba de predicción exitosa'
        }
      };
    }

    return validationResult;
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Error en la validación'
      }]
    };
  }
}
