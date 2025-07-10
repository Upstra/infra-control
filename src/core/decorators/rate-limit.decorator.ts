import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  /**
   * Number of requests allowed within the time window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  window: number;
  /**
   * Optional custom key generator for rate limiting
   * By default uses IP address
   */
  keyGenerator?: (request: any) => string;
  /**
   * Optional custom error message
   */
  errorMessage?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Default rate limit configurations
 */
export const RateLimitConfigs = {
  passwordReset: {
    limit: 3,
    window: 3600, // 1 hour
    errorMessage:
      'Trop de tentatives de réinitialisation. Veuillez réessayer dans une heure.',
  },
  login: {
    limit: 5,
    window: 900, // 15 minutes
    errorMessage:
      'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  },
} as const;
