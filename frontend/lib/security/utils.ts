/**
 * Utilidades de seguridad para el frontend
 */

// Sanitización de entrada de datos
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remover caracteres peligrosos
        .replace(/javascript:/gi, '') // Remover javascript: URLs
        .replace(/on\w+=/gi, '') // Remover event handlers
        .trim()
}

// Validación de URL segura
export function isSecureUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url)
        return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
        return false
    }
}

// Generar CSP nonce para scripts inline
export function generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validación de tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/webp'],
    documents: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
    medical: ['application/pdf', 'text/csv', 'application/json']
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
}

// Encriptación básica para datos sensibles en localStorage
export function encryptSensitiveData(data: string, key?: string): string {
    // Implementación básica - en producción usar librería robusta como crypto-js
    const encoder = new TextEncoder()
    const dataArray = encoder.encode(data)
    const keyArray = encoder.encode(key || 'default-key')

    const encrypted = dataArray.map((byte, index) =>
        byte ^ keyArray[index % keyArray.length]
    )

    return btoa(String.fromCharCode(...encrypted))
}

export function decryptSensitiveData(encryptedData: string, key?: string): string {
    try {
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        const keyArray = encoder.encode(key || 'default-key')

        const encrypted = new Uint8Array(
            atob(encryptedData).split('').map(char => char.charCodeAt(0))
        )

        const decrypted = encrypted.map((byte, index) =>
            byte ^ keyArray[index % keyArray.length]
        )

        return decoder.decode(decrypted)
    } catch {
        return ''
    }
}

// Rate limiting del lado del cliente
class ClientRateLimit {
    private requests: Map<string, number[]> = new Map()

    canMakeRequest(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
        const now = Date.now()
        const requests = this.requests.get(endpoint) || []

        // Limpiar requests antiguos
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

        if (validRequests.length >= maxRequests) {
            return false
        }

        validRequests.push(now)
        this.requests.set(endpoint, validRequests)
        return true
    }

    getRemainingRequests(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): number {
        const now = Date.now()
        const requests = this.requests.get(endpoint) || []
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

        return Math.max(0, maxRequests - validRequests.length)
    }
}

export const clientRateLimit = new ClientRateLimit()

// Detección de ataques comunes
export function detectSuspiciousActivity(input: string): boolean {
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /localStorage/i,
        /sessionStorage/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(input))
}

// Headers de seguridad recomendados
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// Función para reportar incidentes de seguridad
export function reportSecurityIncident(incident: {
    type: string
    details: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp?: Date
}) {
    const report = {
        ...incident,
        timestamp: incident.timestamp || new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: crypto.randomUUID()
    }

    console.warn('[SECURITY] Incidente reportado:', report)

    // En producción, enviar a servicio de monitoreo
    // Example: fetch('/api/security-incidents', { method: 'POST', body: JSON.stringify(report) })
}
