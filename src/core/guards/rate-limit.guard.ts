import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
  encodeBase64Url,
} from '@/core/utils/env-validation.util';
import { RateLimitConfig } from './base-rate-limit.guard';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private generateAuthKey(req: any): string {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const email = sanitizeRateLimitKey(
      req.body?.email ?? req.body?.username ?? '',
    );
    const userAgent = req.get('User-Agent') ?? '';

    if (email && email !== 'anonymous') {
      return `auth:${sanitizeRateLimitKey(ip)}:${email}`;
    }

    const encodedUA = encodeBase64Url(userAgent);
    return `auth:${sanitizeRateLimitKey(ip)}:${encodedUA}`;
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
      keyGenerator: this.generateAuthKey.bind(this),
      skip: this.shouldSkipRateLimit.bind(this),
    });
  }

  private readonly strictLimiter = this.createLimiter({
    windowMs: parseEnvInt(
      process.env.RATE_LIMIT_AUTH_WINDOW_MS,
      900000,
      60000,
      3600000,
    ),
    max: parseEnvInt(process.env.RATE_LIMIT_AUTH_STRICT_MAX, 5, 1, 50),
    message: {
      error: 'Trop de tentatives de connexion. Réessayez plus tard.',
      statusCode: 429,
    },
  });

  private readonly moderateLimiter = this.createLimiter({
    windowMs: parseEnvInt(
      process.env.RATE_LIMIT_AUTH_WINDOW_MS,
      900000,
      60000,
      3600000,
    ),
    max: parseEnvInt(process.env.RATE_LIMIT_AUTH_MODERATE_MAX, 10, 1, 100),
    message: {
      error: 'Trop de tentatives de vérification 2FA. Réessayez plus tard.',
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

    const path = request.route?.path ?? request.url;
    const limiter = this.getLimiterForPath(path);

    return this.executeLimiter(limiter, request, response);
  }

  private getLimiterForPath(path: string) {
    const normalizedPath = path.toLowerCase().replace(/\/+/g, '/');

    if (
      normalizedPath === '/auth/login' ||
      normalizedPath === '/auth/register'
    ) {
      return this.strictLimiter;
    }

    if (
      normalizedPath.startsWith('/auth/2fa') ||
      normalizedPath.includes('/2fa/')
    ) {
      return this.moderateLimiter;
    }

    return this.moderateLimiter;
  }
}
