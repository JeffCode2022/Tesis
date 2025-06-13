import axios, { AxiosError, AxiosResponse } from "axios"
import { getStorage, clearAuthData } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Función auxiliar para manejar el almacenamiento local de forma segura
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const storage = getStorage()
    const token = storage.getItem("auth_token")
    console.log(`[api.ts] getAuthToken: Token recuperado: ${token ? 'Sí' : 'No'}`)
    if (token) {
      console.log(`[api.ts] Token actual: ${token.substring(0, 20)}...`)
      // Verificar si el token está expirado
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]))
        const expirationTime = tokenData.exp * 1000 // Convertir a milisegundos
        const currentTime = Date.now()
        
        if (currentTime >= expirationTime) {
          console.log('[api.ts] Token expirado, intentando refrescar...')
          return null
        }
      } catch (e) {
        console.error('[api.ts] Error al decodificar el token:', e)
        return null
      }
    }
    return token
  } catch (error) {
    console.error('Error al acceder al token de autenticación:', error)
    return null
  }
}

const redirectToLogin = (): void => {
  if (typeof window !== 'undefined') {
    console.log('[api.ts] Redirigiendo a login...')
    setTimeout(() => {
      window.location.href = "/login"
    }, 0)
  }
}

// Crear la instancia de axios
const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
})

// Interceptor para agregar el token a las peticiones
instance.interceptors.request.use(
  async (config) => {
    const token = getAuthToken()
    if (token) {
      // Asegurarse de que el token comienza con 'Bearer ' y no tiene doble prefijo
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      config.headers.Authorization = authToken
      
      console.log('[api.ts] Interceptor de petición:', {
        url: config.url,
        method: config.method,
        headers: {
          ...config.headers,
          Authorization: authToken.substring(0, 20) + '...' // Mostrar solo el inicio del token
        },
        withCredentials: config.withCredentials,
        token: token.substring(0, 20) + '...' // Mostrar solo el inicio del token
      })
    } else {
      console.log('[api.ts] Interceptor de petición: No hay token disponible para adjuntar.')
      // Intentar refrescar el token si no está disponible
      try {
        const storage = getStorage()
        const refreshToken = storage.getItem("refresh_token")
        if (refreshToken) {
          console.log('[api.ts] Intentando refrescar el token...')
          const response = await instance.post("/api/token/refresh/", {
            refresh: refreshToken
          })
          
          if (response.data.access) {
            console.log('[api.ts] Token refrescado exitosamente')
            storage.setItem("auth_token", response.data.access)
            config.headers.Authorization = `Bearer ${response.data.access}`
          }
        }
      } catch (refreshError) {
        console.error('[api.ts] Error al refrescar el token:', refreshError)
      }
    }
    return config
  },
  (error) => {
    console.error('[api.ts] Error en la configuración de la petición:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[api.ts] Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers
    })
    return response
  },
  async (error: AxiosError) => {
    try {
      // Manejo de errores de red
      if (!error.response && !error.request) {
        console.error('[api.ts] Error de configuración:', error.message)
        return Promise.reject(new Error('Error de configuración en la petición'))
      }

      // Manejo de errores de respuesta del servidor
      if (error.response) {
        const { status, data, config } = error.response
        
        // Log detallado del error
        console.error('[api.ts] Error de respuesta:', {
          status,
          url: config?.url,
          method: config?.method,
          requestHeaders: config?.headers,
          responseHeaders: error.response.headers,
          responseData: error.response.data,
          message: error.message,
          withCredentials: config?.withCredentials
        })
        
        // Manejo específico para errores 401
        if (status === 401) {
          const token = getAuthToken()
          const storage = getStorage()
          
          console.log('[api.ts] Error 401: Detalles completos:', {
            requestHeaders: config?.headers,
            responseHeaders: error.response.headers,
            responseData: error.response.data,
            withCredentials: config?.withCredentials,
            token: token ? token.substring(0, 20) + '...' : 'No token',
            url: config?.url,
            method: config?.method,
            storage: {
              localStorage: storage.getItem('auth_token') ? 'Presente' : 'Ausente',
              sessionStorage: storage.getItem('auth_token') ? 'Presente' : 'Ausente',
              currentStorage: storage === localStorage ? 'localStorage' : 'sessionStorage'
            }
          })
          
          // Verificar si el token existe
          if (!token) {
            console.log('[api.ts] No hay token disponible')
            clearAuthData()
            redirectToLogin()
            return Promise.reject(new Error('No hay token de autenticación'))
          }

          // Intentar refrescar el token antes de limpiar los datos
          try {
            const refreshToken = storage.getItem("refresh_token")
            if (refreshToken) {
              console.log('[api.ts] Intentando refrescar el token...')
              const response = await instance.post("/api/token/refresh/", {
                refresh: refreshToken
              })
              
              if (response.data.access) {
                console.log('[api.ts] Token refrescado exitosamente')
                storage.setItem("auth_token", response.data.access)
                // Reintentar la petición original con el nuevo token
                if (config) {
                  config.headers.Authorization = `Bearer ${response.data.access}`
                  return instance(config)
                }
              }
            } else {
              console.log('[api.ts] No hay refresh token disponible')
            }
          } catch (refreshError) {
            console.error('[api.ts] Error al refrescar el token:', refreshError)
            // Rechazar explícitamente la promesa aquí para propagar el error
            return Promise.reject(refreshError)
          }

          // Si el refresh falló o no hay refresh token, limpiar datos y redirigir
          console.log('[api.ts] No se pudo refrescar el token, limpiando datos...')
          clearAuthData()
          redirectToLogin()
          return Promise.reject(new Error('Sesión expirada'))
        }

        // Manejo de errores de cliente (4xx)
        if (status >= 400 && status < 500) {
          console.error('[api.ts] Error de cliente:', data)
          const errorMessage = (data as any)?.detail || (data as any)?.message || 'Error de cliente';
          return Promise.reject(new Error(errorMessage))
        }

        // Manejo de errores del servidor (5xx)
        if (status >= 500) {
          console.error('[api.ts] Error de servidor:', data)
          const errorMessage = (data as any)?.detail || (data as any)?.message || 'Error del servidor';
          return Promise.reject(new Error(errorMessage))
        }
      }

      // Otros errores (ej. de red sin respuesta del servidor)
      console.error('[api.ts] Error de red:', error.message, error.request ? 'con request' : 'sin request', error.config?.withCredentials ? 'con credenciales' : 'sin credenciales')
      return Promise.reject(new Error('No se recibió respuesta del servidor'))

    } catch (finalError) {
      console.error('[api.ts] Error inesperado en el interceptor de errores:', finalError)
      return Promise.reject(new Error('Error inesperado'))
    }
  }
)

// Exportar la instancia de axios
export const api = instance 