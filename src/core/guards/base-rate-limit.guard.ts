import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: {
    error: string;
    statusCode: number;
  };
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
}

@Injectable()
export abstract class BaseRateLimitGuard implements CanActivate {
  protected limiter: ReturnType<typeof rateLimit>;

  constructor(config: RateLimitConfig) {
    this.limiter = this.createLimiter(config);
  }

  protected createLimiter(
    config: RateLimitConfig,
  ): ReturnType<typeof rateLimit> {
    return rateLimit({
      ...config,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator.bind(this),
      skip: config.skip ?? this.defaultSkip.bind(this),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Promise((resolve, reject) => {
      this.limiter(request, response, (err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve(true);
        }
      });
    });
  }

  protected defaultKeyGenerator(req: any): string {
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  protected defaultSkip(req: any): boolean {
    const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return process.env.NODE_ENV === 'test' || testIps.includes(req.ip);
  }
}
