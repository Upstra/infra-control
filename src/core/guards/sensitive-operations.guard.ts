import { Injectable } from '@nestjs/common';
import { BaseRateLimitGuard } from './base-rate-limit.guard';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
} from '@/core/utils/env-validation.util';

@Injectable()
export class SensitiveOperationsGuard extends BaseRateLimitGuard {
  constructor() {
    super({
      windowMs: parseEnvInt(
        process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS,
        3600000,
        300000,
        86400000,
      ),
      max: parseEnvInt(process.env.RATE_LIMIT_SENSITIVE_MAX, 3, 1, 10),
      message: {
        error: "Trop d'opérations sensibles. Réessayez plus tard.",
        statusCode: 429,
      },
      keyGenerator: (req) => {
        const ip = sanitizeRateLimitKey(
          req.ip ?? req.socket?.remoteAddress ?? 'unknown',
        );
        const userId = sanitizeRateLimitKey(
          req.user?.id ?? req.user?.sub ?? '',
        );

        return `sensitive:${ip}:${userId}`;
      },
    });
  }
}
