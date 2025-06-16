import axios from 'axios';
import { setupRetryInterceptor } from './retry';
// import { cache } from './cache';
import { rateLimiter } from './rateLimit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/api/authentication/token/refresh/', {
            refresh: refreshToken,
          });
          localStorage.setItem('auth_token', response.data.access);
          error.config.headers.Authorization = `Bearer ${response.data.access}`;
          return api(error.config);
        }
      } catch (refreshError) {
        // Si falla el refresh, redirigir al login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
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