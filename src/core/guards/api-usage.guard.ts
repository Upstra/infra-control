import { Injectable } from '@nestjs/common';
import { BaseRateLimitGuard } from './base-rate-limit.guard';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
} from '@/core/utils/env-validation.util';

@Injectable()
export class ApiUsageGuard extends BaseRateLimitGuard {
  constructor() {
    super({
      windowMs: parseEnvInt(
        process.env.RATE_LIMIT_API_WINDOW_MS,
        300000,
        60000,
        1800000,
      ),
      max: parseEnvInt(process.env.RATE_LIMIT_API_MAX, 100, 10, 1000),
      message: {
        error: "Quota d'utilisation API dépassé. Réessayez plus tard.",
        statusCode: 429,
      },
      keyGenerator: (req) => {
        const ip = sanitizeRateLimitKey(
          req.ip || req.socket?.remoteAddress || 'unknown',
        );
        const userId = sanitizeRateLimitKey(
          (req as any).user?.id || (req as any).user?.sub || '',
        );

        if (userId && userId !== 'anonymous') {
          return `api:user:${userId}`;
        }
        return `api:ip:${ip}`;
      },
    });
  }
}
