import { z } from 'zod'

// Schema para datos de predicción médica
export const predictionSchema = z.object({
    // Datos personales
    nombre: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
    apellidos: z
        .string()
        .min(2, 'Los apellidos deben tener al menos 2 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras'),
    dni: z
        .string()
        .regex(/^\d{8}[A-Za-z]$/, 'DNI debe tener 8 números seguidos de una letra'),
    fecha_nacimiento: z
        .string()
        .refine((date) => {
            const birthDate = new Date(date)
            const today = new Date()
            const age = today.getFullYear() - birthDate.getFullYear()
            return age >= 18 && age <= 120
        }, 'La edad debe estar entre 18 y 120 años'),

    // Datos físicos
    sexo: z.enum(['M', 'F'], {
        errorMap: () => ({ message: 'Selecciona un sexo válido' })
    }),
    peso: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 30 && num <= 300
        }, 'El peso debe estar entre 30 y 300 kg'),
    altura: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 100 && num <= 250
        }, 'La altura debe estar entre 100 y 250 cm'),

    // Datos vitales
    presion_sistolica: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 70 && num <= 250
        }, 'La presión sistólica debe estar entre 70 y 250 mmHg'),
    presion_diastolica: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 40 && num <= 150
        }, 'La presión diastólica debe estar entre 40 y 150 mmHg'),
    frecuencia_cardiaca: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 40 && num <= 200
        }, 'La frecuencia cardíaca debe estar entre 40 y 200 bpm'),

    // Datos analíticos
    colesterol: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 100 && num <= 400
        }, 'El colesterol debe estar entre 100 y 400 mg/dL'),
    colesterol_hdl: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 20 && num <= 100
        }, 'El HDL debe estar entre 20 y 100 mg/dL'),
    colesterol_ldl: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 50 && num <= 300
        }, 'El LDL debe estar entre 50 y 300 mg/dL'),
    trigliceridos: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 50 && num <= 500
        }, 'Los triglicéridos deben estar entre 50 y 500 mg/dL'),
    glucosa: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 60 && num <= 300
        }, 'La glucosa debe estar entre 60 y 300 mg/dL'),
    hemoglobina_glicosilada: z
        .string()
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num >= 4 && num <= 15
        }, 'La HbA1c debe estar entre 4 y 15%'),

    // Factores de riesgo
    cigarrillos_dia: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 0 && num <= 100
        }, 'Los cigarrillos por día deben estar entre 0 y 100'),
    anos_tabaquismo: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 0 && num <= 80
        }, 'Los años de tabaquismo deben estar entre 0 y 80'),
    actividad_fisica: z
        .string()
        .refine((val) => {
            const num = parseInt(val)
            return !isNaN(num) && num >= 0 && num <= 7
        }, 'Los días de actividad física deben estar entre 0 y 7'),

    // Antecedentes
    antecedentes_cardiacos: z.enum(['0', '1'], {
        errorMap: () => ({ message: 'Selecciona una opción válida para antecedentes cardíacos' })
    }),
    diabetes: z.enum(['0', '1'], {
        errorMap: () => ({ message: 'Selecciona una opción válida para diabetes' })
    }),
    hipertension: z.enum(['0', '1'], {
        errorMap: () => ({ message: 'Selecciona una opción válida para hipertensión' })
    }),

    // Opcional
    numero_historia: z.string().optional()
}).refine((data) => {
    const sistolica = parseInt(data.presion_sistolica)
    const diastolica = parseInt(data.presion_diastolica)
    return sistolica > diastolica
}, {
    message: 'La presión sistólica debe ser mayor que la diastólica',
    path: ['presion_sistolica']
})

export type PredictionFormData = z.infer<typeof predictionSchema>

// Función helper para validar datos médicos
export const validateMedicalData = (data: unknown) => {
    try {
        return predictionSchema.parse(data)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
            throw new Error(`Datos inválidos: ${formattedErrors.map(e => e.message).join(', ')}`)
        }
        throw error
    }
}
