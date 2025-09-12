import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface TokenData {
    access: string
    refresh: string
    user: any
}

// Configuración de cookies seguras
const COOKIE_CONFIG = {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Frontend necesita acceso para axios
    sameSite: 'strict' as const,
    expires: 7 // 7 días para refresh token
}

export class SecureTokenManager {
    private static readonly ACCESS_TOKEN_KEY = 'auth_token'
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token'
    private static readonly USER_DATA_KEY = 'user_data'

    // Guardar tokens de forma segura
    static setTokens(data: TokenData) {
        try {
            // Access token en memoria para mayor seguridad (opción futura)
            Cookies.set(this.ACCESS_TOKEN_KEY, data.access, {
                ...COOKIE_CONFIG,
                expires: 1 / 24 // 1 hora
            })

            // Refresh token con mayor duración
            Cookies.set(this.REFRESH_TOKEN_KEY, data.refresh, COOKIE_CONFIG)

            // Datos de usuario (no sensibles)
            if (data.user) {
                localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data.user))
            }

            console.log('[SecureTokenManager] Tokens guardados de forma segura')
        } catch (error) {
            console.error('[SecureTokenManager] Error al guardar tokens:', error)
            throw new Error('Error al guardar la sesión')
        }
    }

    // Obtener access token
    static getAccessToken(): string | null {
        try {
            return Cookies.get(this.ACCESS_TOKEN_KEY) || null
        } catch (error) {
            console.error('[SecureTokenManager] Error al obtener access token:', error)
            return null
        }
    }

    // Obtener refresh token
    static getRefreshToken(): string | null {
        try {
            return Cookies.get(this.REFRESH_TOKEN_KEY) || null
        } catch (error) {
            console.error('[SecureTokenManager] Error al obtener refresh token:', error)
            return null
        }
    }

    // Obtener datos de usuario
    static getUserData(): any | null {
        try {
            const userData = localStorage.getItem(this.USER_DATA_KEY)
            return userData ? JSON.parse(userData) : null
        } catch (error) {
            console.error('[SecureTokenManager] Error al obtener datos de usuario:', error)
            return null
        }
    }

    // Verificar si el token es válido
    static isTokenValid(token: string | null): boolean {
        if (!token) return false

        try {
            const decoded: any = jwtDecode(token)
            const now = Date.now() / 1000
            return decoded.exp && decoded.exp > now
        } catch (error) {
            console.warn('[SecureTokenManager] Token inválido:', error)
            return false
        }
    }

    // Verificar autenticación
    static isAuthenticated(): boolean {
        const accessToken = this.getAccessToken()
        const refreshToken = this.getRefreshToken()

        // Si hay access token válido, está autenticado
        if (this.isTokenValid(accessToken)) {
            return true
        }

        // Si no hay access token pero hay refresh token válido, puede renovar
        if (this.isTokenValid(refreshToken)) {
            return true
        }

        return false
    }

    // Limpiar todos los tokens
    static clearTokens() {
        try {
            Cookies.remove(this.ACCESS_TOKEN_KEY)
            Cookies.remove(this.REFRESH_TOKEN_KEY)
            localStorage.removeItem(this.USER_DATA_KEY)

            console.log('[SecureTokenManager] Tokens eliminados')
        } catch (error) {
            console.error('[SecureTokenManager] Error al limpiar tokens:', error)
        }
    }

    // Obtener tiempo restante del token
    static getTokenExpiration(token: string | null): number | null {
        if (!token) return null

        try {
            const decoded: any = jwtDecode(token)
            return decoded.exp ? decoded.exp * 1000 : null // Convertir a milliseconds
        } catch (error) {
            return null
        }
    }

    // Verificar si el token expira pronto (menos de 5 minutos)
    static shouldRefreshToken(): boolean {
        const accessToken = this.getAccessToken()
        const expiration = this.getTokenExpiration(accessToken)

        if (!expiration) return true

        const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
        return expiration < fiveMinutesFromNow
    }
}

// Función de compatibilidad con el código existente
export const clearAuthData = SecureTokenManager.clearTokens
