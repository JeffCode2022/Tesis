import { z } from 'zod'

// Schema para login
export const loginSchema = z.object({
    email: z
        .string()
        .email('Por favor ingresa un email válido')
        .min(1, 'El email es requerido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    rememberMe: z.boolean().optional()
})

// Schema para registro
export const registerSchema = z.object({
    email: z
        .string()
        .email('Por favor ingresa un email válido')
        .min(1, 'El email es requerido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'La contraseña debe contener mayúscula, minúscula, número y símbolo'),
    confirmPassword: z.string(),
    nombre: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
