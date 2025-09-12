import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

const defaultConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

export const withRetry = async <T>(
  request: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;

  for (let i = 0; i <= finalConfig.retries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;

      if (i === finalConfig.retries) {
        break;
      }

      const axiosError = error as AxiosError;
      if (
        axiosError.response &&
        !finalConfig.retryableStatusCodes.includes(axiosError.response.status)
      ) {
        throw error;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve =>
        setTimeout(resolve, finalConfig.retryDelay * Math.pow(2, i))
      );
    }
  }

  throw lastError;
};

// Interceptor para aplicar retry logic automáticamente
export const setupRetryInterceptor = (axiosInstance: AxiosInstance, config: Partial<RetryConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const axiosError = error as AxiosError;
      const originalConfig = axiosError.config as AxiosRequestConfig & { _retryCount?: number };

      // Evitar bucles infinitos
      if (!originalConfig || originalConfig._retryCount! >= finalConfig.retries) {
        return Promise.reject(error);
      }

      // Solo reintentar para códigos de estado específicos y errores de red
      if (
        (axiosError.response && finalConfig.retryableStatusCodes.includes(axiosError.response.status)) ||
        (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNABORTED')
      ) {
        originalConfig._retryCount = originalConfig._retryCount || 0;
        originalConfig._retryCount++;

        console.log(`[Retry] Intento ${originalConfig._retryCount} para ${originalConfig.url}`);

        // Esperar antes del reintento
        await new Promise(resolve =>
          setTimeout(resolve, finalConfig.retryDelay * Math.pow(2, originalConfig._retryCount! - 1))
        );

        return axiosInstance(originalConfig);
      }

      return Promise.reject(error);
    }
  );
};
