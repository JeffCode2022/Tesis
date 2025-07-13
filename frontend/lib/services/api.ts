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

// Función auxiliar para obtener el token CSRF de las cookies
const getCsrfToken = (): string | null => {
  if (typeof window === 'undefined') return null
  const name = 'csrftoken'
  const cookieValue = document.cookie.split(';').find(c => c.trim().startsWith(name + '='))
  if (cookieValue) {
    return decodeURIComponent(cookieValue.trim().substring(name.length + 1))
  }
  return null
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
    // No añadir token de autenticación para las rutas de login o registro
    const isAuthEndpoint = config.url?.includes('/authentication/login/') || config.url?.includes('/register/')

    if (!isAuthEndpoint) {
      const token = getAuthToken()
      if (token) {
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        config.headers.Authorization = authToken
      } else {
        console.log('[api.ts] Interceptor de petición: No hay token de autenticación disponible para adjuntar.')
      }
    } else {
      console.log('[api.ts] Interceptor de petición: No se añade token de autenticación para la ruta de login/registro.')
      delete config.headers.Authorization; // Asegurarse de que no se envía ningún encabezado de autorización
    }

    // Añadir el token CSRF para métodos que lo requieran
    const csrfToken = getCsrfToken()
    const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() || '')
    if (csrfToken && !isSafeMethod) {
      config.headers['X-CSRFToken'] = csrfToken
      console.log('[api.ts] Interceptor de petición: CSRF Token adjuntado.')
    } else if (!isSafeMethod) {
      console.warn('[api.ts] Interceptor de petición: No se encontró CSRF Token para una petición no segura.')
    }

    console.log('[api.ts] Interceptor de petición:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? (config.headers.Authorization as string).substring(0, 20) + '...' : 'No Token',
        'X-CSRFToken': csrfToken ? csrfToken.substring(0, 10) + '...' : 'No CSRF Token'
      },
      withCredentials: config.withCredentials,
    })

    // Intentar refrescar el token si no está disponible (solo si no es la petición de login/register)
    if (!config.headers.Authorization && !isAuthEndpoint) {
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

    // Log detallado para errores 400
    if (error.response?.status === 400) {
      console.error('[api.ts] Error 400 detectado:');
      console.error('[api.ts] URL:', originalRequest.url);
      console.error('[api.ts] Method:', originalRequest.method);
      console.error('[api.ts] Request data:', originalRequest.data);
      console.error('[api.ts] Response data:', error.response.data);
      console.error('[api.ts] Response status:', error.response.status);
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
            originalRequest.headers['X-CSRFToken'] = getCsrfToken(); // Añadir CSRF al reintento
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