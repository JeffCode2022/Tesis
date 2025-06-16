import { api } from './api';

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requestQueue: number[] = [];
  private readonly config: RateLimitConfig;

  private constructor(config: RateLimitConfig) {
    this.config = config;
  }

  public static getInstance(config: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  private cleanup(): void {
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(
      timestamp => now - timestamp < this.config.timeWindow
    );
  }

  public async waitForSlot(): Promise<void> {
    this.cleanup();

    if (this.requestQueue.length >= this.config.maxRequests) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = this.config.timeWindow - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.cleanup();
    }

    this.requestQueue.push(Date.now());
  }
}

// Configuración por defecto: 100 requests por minuto
const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  timeWindow: 60 * 1000 // 1 minuto
};

export const rateLimiter = RateLimiter.getInstance(defaultConfig);

// Interceptor para aplicar rate limiting
api.interceptors.request.use(async (config) => {
  await rateLimiter.waitForSlot();
  return config;
}); 