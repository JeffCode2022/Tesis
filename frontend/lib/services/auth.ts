import { api } from "@/lib/api"
import axios from "axios"
import Cookies from "js-cookie";

export interface LoginData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  nombre?: string
}

export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: any
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = "AuthError"
  }
}

// Funciones auxiliares
export const setAuthData = (data: { token: string; refresh: string; user: User }, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return // Ejecutar solo en el cliente
  try {
    const storage = rememberMe ? localStorage : sessionStorage
    const userData = JSON.stringify(data.user)
    
    console.log(`[auth.ts] Intento de guardar datos de autenticación. RememberMe: ${rememberMe ? 'true' : 'false'}`);
    
    // Validar el token
    if (!data.token || typeof data.token !== 'string' || data.token.length < 10) {
      throw new Error("Token inválido o mal formado")
    }
    
    // Validar el refresh token
    if (!data.refresh || typeof data.refresh !== 'string' || data.refresh.length < 10) {
      throw new Error("Refresh token inválido o mal formado")
    }
    
    // Validar el usuario
    if (!isValidUser(data.user)) {
      throw new Error("Datos de usuario inválidos")
    }
    
    console.log('[auth.ts] Datos validados correctamente:', {
      token: data.token.substring(0, 20) + '...',
      refresh: data.refresh.substring(0, 20) + '...',
      user: data.user
    });
    
    // Limpiar datos existentes primero
    clearAuthData()
    
    // Guardar nuevos datos
    storage.setItem("auth_token", data.token)
    storage.setItem("refresh_token", data.refresh)
    storage.setItem("auth_user", userData)
    storage.setItem("rememberMe", String(rememberMe))
    
    // Verificar que los datos se guardaron correctamente
    const savedToken = storage.getItem("auth_token")
    const savedRefresh = storage.getItem("refresh_token")
    const savedUser = storage.getItem("auth_user")
    const savedRememberMe = storage.getItem("rememberMe")

    if (!savedToken || !savedRefresh || !savedUser || savedRememberMe !== String(rememberMe)) {
      throw new Error("Error al verificar datos de autenticación guardados")
    }

    // Verificar que el usuario guardado es válido
    const parsedUser = JSON.parse(savedUser)
    if (!isValidUser(parsedUser)) {
      throw new Error("Error al verificar datos de usuario guardados")
    }

    console.log('[auth.ts] Datos de autenticación guardados exitosamente.', { 
      token: savedToken.substring(0, 20) + '...',
      refresh: savedRefresh.substring(0, 20) + '...',
      user: parsedUser
    });
  } catch (error) {
    console.error("Error al guardar datos de autenticación:", error)
    clearAuthData()
    throw error
  }
}

export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return // Ejecutar solo en el cliente
  try {
    console.log('[auth.ts] Limpiando datos de autenticación...');
    // Limpiar localStorage
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("rememberMe")
    
    // Limpiar sessionStorage
    sessionStorage.removeItem("auth_token")
    sessionStorage.removeItem("refresh_token")
    sessionStorage.removeItem("auth_user")
    sessionStorage.removeItem("rememberMe")
    console.log('[auth.ts] Datos de autenticación limpiados.');
  } catch (error) {
    console.error("Error al limpiar datos de autenticación:", error)
  }
}

export const getStorage = (): Storage => {
  if (typeof window === 'undefined') return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage // Devolver un mock en el servidor
  const rememberMe = localStorage.getItem("rememberMe") === "true"
  return rememberMe ? localStorage : sessionStorage
}

const isValidUser = (user: any): user is User => {
  if (!user || typeof user !== "object") {
    return false;
  }
  
  const requiredFields = {
    id: "string",
    email: "string",
    username: "string",
    first_name: "string",
    last_name: "string",
    is_active: "boolean",
    created_at: "string",
    updated_at: "string"
  };

  for (const [field, type] of Object.entries(requiredFields)) {
    if (typeof user[field] !== type) {
      console.error(`isValidUser: Field '${field}' expected type '${type}', but got '${typeof user[field]}' (value: ${JSON.stringify(user[field])})`);
      return false;
    }
  }

  return true;
};

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('[auth.ts] Iniciando login...', { email: data.email, rememberMe: data.rememberMe })
      const response = await api.post<AuthResponse>("/api/authentication/login/", {
        email: data.email,
        password: data.password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      })
      
      console.log('[auth.ts] Respuesta del servidor:', {
        access: response.data.access ? 'Token presente' : 'Token ausente',
        refresh: response.data.refresh ? 'Refresh token presente' : 'Refresh token ausente',
        user: response.data.user ? 'Usuario presente' : 'Usuario ausente'
      });

      if (!response.data.access || !response.data.refresh || !response.data.user) {
        throw new Error("Respuesta de login inválida")
      }

      // Guardar datos de autenticación
      const storage = data.rememberMe ? localStorage : sessionStorage
      storage.setItem("auth_token", response.data.access)
      storage.setItem("refresh_token", response.data.refresh)
      storage.setItem("auth_user", JSON.stringify(response.data.user))
      storage.setItem("rememberMe", String(data.rememberMe))

      // Guardar el token en cookies para el middleware
      Cookies.set('auth_token', response.data.access, { expires: data.rememberMe ? 7 : undefined })

      // Verificar que los tokens se guardaron correctamente
      const savedToken = storage.getItem("auth_token")
      const savedRefresh = storage.getItem("refresh_token")
      console.log('[auth.ts] Tokens guardados:', {
        token: savedToken ? 'Presente' : 'Ausente',
        refresh: savedRefresh ? 'Presente' : 'Ausente'
      });

      return response.data
    } catch (error) {
      console.error("[auth.ts] Error en login:", error)
      throw error
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/api/register/", data)
      
      // Validar la respuesta antes de guardar
      if (!response.data.user || !isValidUser(response.data.user)) {
        throw new AuthError("Datos de usuario inválidos en la respuesta", "INVALID_USER_DATA")
      }
      
      setAuthData({
        token: response.data.access,
        refresh: response.data.refresh,
        user: response.data.user
      }, false)
      
      return response.data
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new AuthError("El correo electrónico ya está registrado", "EMAIL_EXISTS")
      } else if (axios.isAxiosError(error) && error.response) {
        throw new AuthError(error.response.data.message || "Error del servidor", `SERVER_ERROR_${error.response.status}`)
      } else if (error instanceof Error) {
        throw new AuthError(error.message, "GENERIC_ERROR")
      }
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      const currentStorage = getStorage()
      const refreshToken = currentStorage.getItem("refresh_token")
      
      if (!refreshToken) {
        console.warn("No refresh token found for logout. Clearing local data only.")
        return
      }
      
      await api.post("/api/authentication/logout/", { refresh: refreshToken })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      clearAuthData()
    }
  },

  async refreshToken(): Promise<{ access: string }> {
    const currentStorage = getStorage()
    try {
      const refreshToken = currentStorage.getItem("refresh_token")
      if (!refreshToken) {
        throw new AuthError("No hay token de actualización disponible", "SESSION_EXPIRED")
      }

      const response = await api.post<{ access: string }>("/api/token/refresh/", {
        refresh: refreshToken
      })
      
      currentStorage.setItem("auth_token", response.data.access)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        clearAuthData()
        window.location.href = "/login"
      } else if (axios.isAxiosError(error) && error.response) {
        throw new AuthError(error.response.data.message || "Error del servidor", `SERVER_ERROR_${error.response.status}`)
      } else if (error instanceof Error) {
        throw new AuthError(error.message, "GENERIC_ERROR")
      }
      throw error
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false // En el servidor, no autenticado por almacenamiento
    const token = this.getToken()
    const user = this.getUser()
    return !!token && !!user
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null // En el servidor, no hay token
    const storage = getStorage()
    return storage.getItem("auth_token")
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null // En el servidor, no hay usuario
    const storage = getStorage()
    const user = storage.getItem("auth_user")
    return user ? JSON.parse(user) : null
  },

  // Método para verificar y renovar el token automáticamente
  async checkAndRefreshToken(): Promise<void> {
    if (typeof window === 'undefined') return // Ejecutar solo en el cliente
    try {
      const currentStorage = getStorage()
      const token = currentStorage.getItem("auth_token")
      const refreshToken = currentStorage.getItem("refresh_token")

      if (!token || !refreshToken) {
        return
      }

      try {
        const tokenData = JSON.parse(atob(token.split(".")[1]))
        const expirationTime = tokenData.exp * 1000
        const currentTime = Date.now()
        const timeUntilExpiration = expirationTime - currentTime

        if (timeUntilExpiration < 300000) {
          await this.refreshToken()
        }
      } catch (error) {
        console.error("Error al verificar el token:", error)
        clearAuthData()
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Error en checkAndRefreshToken:", error)
      clearAuthData()
      window.location.href = "/login"
    }
  }
}; 