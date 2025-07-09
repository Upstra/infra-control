import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
} from '@/core/utils/env-validation.util';
import { RateLimitConfig } from '@/core/guards/base-rate-limit.guard';

@Injectable()
export class DashboardRateLimitGuard implements CanActivate {
  private generateDashboardKey(req: any): string {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const userId = req.user?.id ?? 'anonymous';
    const endpoint = req.path ?? '';

    return `dashboard:${sanitizeRateLimitKey(ip)}:${userId}:${endpoint}`;
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
      keyGenerator: this.generateDashboardKey.bind(this),
      skip: this.shouldSkipRateLimit.bind(this),
    });
  }

  private readonly apiLimiter = this.createLimiter({
    windowMs: parseEnvInt(
      process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS,
      60000, // 1 minute par défaut
      1000,
      300000,
    ),
    max: parseEnvInt(process.env.RATE_LIMIT_DASHBOARD_API_MAX, 100, 10, 1000), // 100 req/min
    message: {
      error: 'Trop de requêtes sur le dashboard. Réessayez plus tard.',
      statusCode: 429,
    },
  });

  private readonly widgetLimiter = this.createLimiter({
    windowMs: parseEnvInt(
      process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS,
      60000, // 1 minute
      1000,
      300000,
    ),
    max: parseEnvInt(
      process.env.RATE_LIMIT_DASHBOARD_WIDGET_MAX,
      200,
      10,
      2000,
    ), // plus permissif pour les widgets
    message: {
      error: 'Trop de requêtes sur les widgets. Réessayez plus tard.',
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
    const normalizedPath = (path || '').toLowerCase().replace(/\/+/g, '/');

    if (normalizedPath.includes('/widgets/')) {
      return this.widgetLimiter;
    }

    return this.apiLimiter;
  }
}
