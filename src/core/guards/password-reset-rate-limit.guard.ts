import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
} from '@/core/utils/env-validation.util';
import { RateLimitConfig } from './base-rate-limit.guard';

@Injectable()
export class PasswordResetRateLimitGuard implements CanActivate {
  private generatePasswordResetKey(req: any): string {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const email = sanitizeRateLimitKey(req.body?.email ?? '');
    
    // Use both IP and email to prevent abuse while allowing legitimate use
    if (email && email !== 'anonymous') {
      return `password-reset:${sanitizeRateLimitKey(ip)}:${email}`;
    }
    
    return `password-reset:${sanitizeRateLimitKey(ip)}`;
  }

  private shouldSkipRateLimit(req: any): boolean {
    const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return process.env.NODE_ENV === 'test' || testIps.includes(req.ip);
  }

  private createLimiter(config: RateLimitConfig) {
    return rateLimit({
      ...config,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: this.generatePasswordResetKey.bind(this),
      skip: this.shouldSkipRateLimit.bind(this),
    });
  }

  private readonly passwordResetLimiter = this.createLimiter({
    windowMs: parseEnvInt(
      process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
      3600000, // 1 hour default
      60000,   // 1 minute minimum
      86400000 // 24 hours maximum
    ),
    max: parseEnvInt(
      process.env.RATE_LIMIT_PASSWORD_RESET_MAX,
      3, // 3 attempts default
      1, // 1 attempt minimum
      10 // 10 attempts maximum
    ),
    message: {
      error: 'Trop de tentatives de réinitialisation de mot de passe. Veuillez réessayer dans une heure.',
      statusCode: 429,
    },
  });

  private executeLimiter(
    limiter: ReturnType<typeof rateLimit>,
    request: any,
    response: any,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      limiter(request, response, (err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve(true);
        }
      });
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return this.executeLimiter(this.passwordResetLimiter, request, response);
  }
}