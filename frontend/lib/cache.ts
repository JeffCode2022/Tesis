import { api } from './api';
import axios from 'axios';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  public clear(): void {
    this.cache.clear();
  }

  public remove(key: string): void {
    this.cache.delete(key);
  }
}

// Interceptor para caché de GET requests
api.interceptors.request.use(async (config) => {
  if (config.method === 'get' && config.url) {
    const cache = Cache.getInstance();
    const cachedData = cache.get(config.url);
    if (cachedData) {
      // Cancelar la petición original y devolver datos en caché
      config.cancelToken = new axios.CancelToken(cancel => {
        cancel('Request cancelled due to cache hit');
      });
      return Promise.reject({
        __CACHE_HIT__: true,
        data: cachedData
      });
    }
  }
  return config;
});

// Interceptor para guardar respuestas en caché
api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && response.config.url) {
      const cache = Cache.getInstance();
      cache.set(response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    if (error.__CACHE_HIT__) {
      return Promise.resolve({ data: error.data });
    }
    return Promise.reject(error);
  }
);

export const cache = Cache.getInstance(); 