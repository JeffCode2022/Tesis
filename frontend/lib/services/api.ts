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
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const storage = getStorage();

    // Si no hay configuración original, rechazar inmediatamente
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Si el error es 401 y no es una petición de refresh
    if (error.response?.status === 401 && !originalRequest.url?.includes('/token/refresh/')) {
      try {
        const refreshToken = storage.getItem("refresh_token");
        if (refreshToken) {
          console.log('[api.ts] Intentando refrescar el token...');
          const response = await instance.post("/api/token/refresh/", {
            refresh: refreshToken
          });
          
          if (response.data.access) {
            console.log('[api.ts] Token refrescado exitosamente');
            storage.setItem("auth_token", response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return instance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[api.ts] Error al refrescar el token:', refreshError);
      }

      // Si llegamos aquí, el refresh falló o no hay refresh token
      console.log('[api.ts] No se pudo refrescar el token, limpiando datos...');
      clearAuthData();
      redirectToLogin();
      return Promise.reject(new Error('Sesión expirada'));
    }

    // Para otros errores, extraer el mensaje de error del backend
    const errorData = error.response?.data as { detail?: string; message?: string } | undefined;
    const errorMessage = errorData?.detail || 
                        errorData?.message || 
                        error.message || 
                        'Error en la petición';
    
    return Promise.reject(new Error(errorMessage));
  }
)

// Exportar la instancia de axios
export const api = instance 