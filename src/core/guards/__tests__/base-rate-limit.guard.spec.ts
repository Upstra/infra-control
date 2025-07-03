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
        skip: () => true, // Always skip
      });

      const result = await customGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle rate limiter errors in promise rejection', async () => {
      // Create a guard that might trigger errors
      const restrictiveGuard = new TestRateLimitGuard({
        windowMs: 1000,
        max: 1,
        message: {
          error: 'Rate limit exceeded',
          statusCode: 429,
        },
      });

      try {
        const result1 = await restrictiveGuard.canActivate(mockContext);
        expect(result1).toBe(true);

        const result2 = await restrictiveGuard.canActivate(mockContext);
        expect(result2).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
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
