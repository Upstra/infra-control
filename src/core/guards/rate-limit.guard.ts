import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: {
    error: string;
    statusCode: number;
  };
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private createLimiter(config: RateLimitConfig) {
    return rateLimit({
      ...config,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const email = req.body?.email || req.body?.username || '';
        const userAgent = req.get('User-Agent') || '';

        if (email) {
          return `auth:${ip}:${email}`;
        }

        return `auth:${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`;
      },
      skip: (req) => {
        const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
        return process.env.NODE_ENV === 'test' || testIps.includes(req.ip);
      },
    });
  }

  private strictLimiter = this.createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_AUTH_STRICT_MAX || '5'),
    message: {
      error: 'Trop de tentatives de connexion. Réessayez plus tard.',
      statusCode: 429,
    },
  });

  private moderateLimiter = this.createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_AUTH_MODERATE_MAX || '10'),
    message: {
      error: 'Trop de tentatives de vérification 2FA. Réessayez plus tard.',
      statusCode: 429,
    },
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const path = request.route?.path || request.url;
    const limiter = this.getLimiterForPath(path);

    return new Promise((resolve, reject) => {
      limiter(request, response, (err: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  private getLimiterForPath(path: string) {
    if (path.includes('/login') || path.includes('/register')) {
      return this.strictLimiter;
    }

    if (path.includes('/2fa')) {
      return this.moderateLimiter;
    }

    return this.moderateLimiter;
  }
}
