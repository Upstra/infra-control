import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

@Injectable()
export class ApiUsageGuard implements CanActivate {
  private limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '300000'),
    max: parseInt(process.env.RATE_LIMIT_API_MAX || '100'),
    message: {
      error: "Quota d'utilisation API dépassé. Réessayez plus tard.",
      statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || (req as any).user?.sub || '';

      if (userId) {
        return `api:user:${userId}`;
      }
      return `api:ip:${ip}`;
    },
    skip: (req) => {
      const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      return process.env.NODE_ENV === 'test' || testIps.includes(req.ip);
    },
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Promise((resolve, reject) => {
      this.limiter(request, response, (err: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}
