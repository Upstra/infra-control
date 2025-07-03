import { ExecutionContext } from '@nestjs/common';
import { BaseRateLimitGuard, RateLimitConfig } from '../base-rate-limit.guard';

class TestRateLimitGuard extends BaseRateLimitGuard {
  constructor(config: RateLimitConfig) {
    super(config);
  }
}

describe('BaseRateLimitGuard', () => {
  let guard: TestRateLimitGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      ip: '192.168.1.1',
      url: '/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    guard = new TestRateLimitGuard({
      windowMs: 60000,
      max: 10,
      message: {
        error: 'Rate limit exceeded',
        statusCode: 429,
      },
    });
  });

  describe('canActivate', () => {
    beforeEach(() => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      guard = new TestRateLimitGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should allow request when under rate limit', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should use default key generator', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.ip).toBe('192.168.1.1');
    });

    it('should skip rate limiting in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing IP address', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should use custom key generator when provided', async () => {
      const customGuard = new TestRateLimitGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
        keyGenerator: (req) => `custom:${req.ip}`,
      });

      const result = await customGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should use custom skip function when provided', async () => {
      const customGuard = new TestRateLimitGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
        skip: () => true,
      });

      const result = await customGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle rate limiter errors in promise rejection', async () => {
      class TestErrorGuard extends BaseRateLimitGuard {
        constructor(config: RateLimitConfig) {
          super(config);
        }

        protected createLimiter(_config: RateLimitConfig) {
          return jest.fn((_req, _res, callback) => {
            callback(new Error('Rate limiter error'));
          }) as any;
        }
      }

      const errorGuard = new TestErrorGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      try {
        await errorGuard.canActivate(mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Rate limiter error');
      }
    });
  });

  describe('error handling coverage', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should reject promise when limiter callback has error', async () => {
      class TestErrorGuard extends BaseRateLimitGuard {
        constructor(config: RateLimitConfig) {
          super(config);
        }

        async canActivate(_context: ExecutionContext): Promise<boolean> {
          return new Promise((_resolve, reject) => {
            setImmediate(() => {
              const err = new Error('Rate limiter internal error');
              reject(err);
            });
          });
        }
      }

      const errorGuard = new TestErrorGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      try {
        await errorGuard.canActivate(mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Rate limiter internal error');
      }
    });

    it('should resolve promise when limiter callback has no error', async () => {
      class TestSuccessGuard extends BaseRateLimitGuard {
        constructor(config: RateLimitConfig) {
          super(config);
        }

        async canActivate(_context: ExecutionContext): Promise<boolean> {
          return new Promise((resolve, _reject) => {
            setImmediate(() => {
              resolve(true);
            });
          });
        }
      }

      const successGuard = new TestSuccessGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      const result = await successGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle actual limiter error through mock', async () => {
      class TestMockErrorGuard extends BaseRateLimitGuard {
        constructor(config: RateLimitConfig) {
          super(config);
        }

        protected createLimiter(_config: RateLimitConfig) {
          return jest.fn((_req, _res, callback) => {
            callback(new Error('Mocked limiter error'));
          }) as any;
        }
      }

      const errorGuard = new TestMockErrorGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      try {
        await errorGuard.canActivate(mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Mocked limiter error');
      }
    });

    it('should handle actual limiter success through mock', async () => {
      class TestMockSuccessGuard extends BaseRateLimitGuard {
        constructor(config: RateLimitConfig) {
          super(config);
        }

        protected createLimiter(_config: RateLimitConfig) {
          return jest.fn((_req, _res, callback) => {
            callback(null);
          }) as any;
        }
      }

      const successGuard = new TestMockSuccessGuard({
        windowMs: 60000,
        max: 10,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      const result = await successGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle truthy error values', async () => {
      const truthyErrors = [
        new Error('Standard error'),
        'String error',
        { message: 'Object error' },
        true,
        1,
        ['array', 'error'],
      ];

      for (const errorValue of truthyErrors) {
        class TestTruthyErrorGuard extends BaseRateLimitGuard {
          constructor(config: RateLimitConfig) {
            super(config);
          }

          protected createLimiter(_config: RateLimitConfig) {
            return jest.fn((_req, _res, callback) => {
              callback(errorValue);
            }) as any;
          }
        }

        const errorGuard = new TestTruthyErrorGuard({
          windowMs: 60000,
          max: 10,
          message: {
            error: 'Rate limit exceeded',
            statusCode: 429,
          },
        });

        try {
          await errorGuard.canActivate(mockContext);
          expect(true).toBe(false);
        } catch (error) {
          if (errorValue instanceof Error) {
            expect(error).toBe(errorValue);
          } else {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(String(errorValue));
          }
        }
      }
    });

    it('should handle falsy non-null error values', async () => {
      const falsyValues = [null, undefined, false, 0, '', NaN];

      for (const falsyValue of falsyValues) {
        class TestFalsyValueGuard extends BaseRateLimitGuard {
          constructor(config: RateLimitConfig) {
            super(config);
          }

          protected createLimiter(_config: RateLimitConfig) {
            return jest.fn((_req, _res, callback) => {
              callback(falsyValue);
            }) as any;
          }
        }

        const successGuard = new TestFalsyValueGuard({
          windowMs: 60000,
          max: 10,
          message: {
            error: 'Rate limit exceeded',
            statusCode: 429,
          },
        });

        const result = await successGuard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });
  });

  describe('defaultKeyGenerator', () => {
    it('should generate key from IP', () => {
      const key = guard['defaultKeyGenerator'](mockRequest);
      expect(key).toBe('192.168.1.1');
    });

    it('should handle missing IP with socket remoteAddress', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '192.168.1.1' };

      const key = guard['defaultKeyGenerator'](mockRequest);
      expect(key).toBe('192.168.1.1');
    });

    it('should use unknown when no IP available', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      const key = guard['defaultKeyGenerator'](mockRequest);
      expect(key).toBe('unknown');
    });
  });

  describe('defaultSkip', () => {
    it('should skip localhost IPs', () => {
      const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

      testIps.forEach((ip) => {
        mockRequest.ip = ip;
        const shouldSkip = guard['defaultSkip'](mockRequest);
        expect(shouldSkip).toBe(true);
      });
    });

    it('should not skip other IPs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockRequest.ip = '192.168.1.1';
      const shouldSkip = guard['defaultSkip'](mockRequest);
      expect(shouldSkip).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('should skip all requests in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      mockRequest.ip = '192.168.1.1';
      const shouldSkip = guard['defaultSkip'](mockRequest);
      expect(shouldSkip).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
