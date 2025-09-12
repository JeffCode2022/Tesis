import axios from 'axios';
import { setupRetryInterceptor } from './retry';
// import { cache } from './cache';
import { rateLimiter } from './rateLimit';
import { clearAuthData } from './services/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 segundos timeout
});

// Interceptor para agregar el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Función para verificar si un error es de cancelación
const isCancelError = (error: any) => {
  return axios.isCancel(error) ||
    (error && error.message && (
      error.message.includes('canceled') ||
      error.message.includes('aborted') ||
      error.message === 'canceled' ||
      error.message === 'aborted' ||
      error.code === 'ECONNABORTED' ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError'
    ));
};

// Interceptor para manejar respuestas exitosas
api.interceptors.response.use(
  (response) => {
    // Solo mostrar logs en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Respuesta exitosa:', {
        status: response.status,
        url: response.config?.url,
        method: response.config?.method?.toUpperCase(),
        data: response.data
      });
    }

    // Verificar si la respuesta es válida
    if (!response) {
      console.error('[API] Respuesta vacía recibida');
      throw new Error('No se recibió respuesta del servidor');
    }

    return response;
  },
  async (error) => {
    // Verificar si el error es de cancelación
    if (isCancelError(error)) {
      // No hacer nada para errores de cancelación
      console.log('[API] Solicitud cancelada:', error.message || 'Sin mensaje de error');
      return Promise.reject({ isCanceled: true, message: 'La operación fue cancelada' });
    }

    // Verificar si hay un error de red
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('[API] Error de red:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });

      // Verificar si el navegador está offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject({
          isNetworkError: true,
          message: 'No hay conexión a internet. Por favor, verifica tu conexión.'
        });
      }

      return Promise.reject({
        isNetworkError: true,
        message: 'No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.'
      });
    }

    // Verificar si es un error de tiempo de espera
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('[API] Tiempo de espera agotado:', {
        url: error.config?.url,
        timeout: error.config?.timeout,
        message: error.message
      });

      return Promise.reject({
        isTimeout: true,
        message: 'La solicitud está tardando demasiado. Por favor, verifica tu conexión e inténtalo de nuevo.'
      });
    }

    // Solo mostrar logs detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const errorDetails = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        config: {
          headers: error.config?.headers,
          timeout: error.config?.timeout,
          withCredentials: error.config?.withCredentials
        }
      };

      console.error('[API] Error en la petición:', errorDetails);
    }

    // Manejar error 401 (No autorizado)
    if (error.response?.status === 401) {
      // Evitar bucle infinito si ya estamos intentando refrescar el token
      if (error.config?.url?.includes('/token/refresh/')) {
        console.log('[API] Error al refrescar el token, redirigiendo a login');
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Intentar refresh token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('[API] Intentando refrescar token...');
          const response = await api.post('/api/authentication/token/refresh/', {
            refresh: refreshToken,
          });

          if (response.data?.access) {
            console.log('[API] Token refrescado exitosamente');
            localStorage.setItem('auth_token', response.data.access);
            if (error.config?.headers) {
              error.config.headers.Authorization = `Bearer ${response.data.access}`;
            }
            return api(error.config);
          }
        }
      } catch (refreshError) {
        console.error('[API] Error al refrescar token:', refreshError);
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Para otros errores, simplemente rechazar con el error
    return Promise.reject(error);
  }
);

// Configurar retry logic
setupRetryInterceptor(api, {
  retries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
});

// Configurar rate limiting
const rateLimitConfig = {
  maxRequests: 100,
  timeWindow: 60 * 1000 // 1 minuto
};

// Función helper para limpiar caché de un endpoint específico
// export const clearEndpointCache = (endpoint: string) => {
//   cache.remove(endpoint);
// };

// Función helper para limpiar toda la caché
// export const clearAllCache = () => {
//   cache.clear();
// };

export { api }; 