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
      
      if (
        axiosError.response &&
        finalConfig.retryableStatusCodes.includes(axiosError.response.status)
      ) {
        const config = axiosError.config as AxiosRequestConfig;
        return withRetry(() => axiosInstance(config), finalConfig);
      }

      return Promise.reject(error);
    }
  );
};
