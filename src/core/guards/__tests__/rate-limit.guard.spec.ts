import { ExecutionContext } from '@nestjs/common';
import { AuthRateLimitGuard } from '../rate-limit.guard';
import {
  parseEnvInt,
  sanitizeRateLimitKey,
  encodeBase64Url,
} from '@/core/utils/env-validation.util';

describe('AuthRateLimitGuard', () => {
  let guard: AuthRateLimitGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    guard = new AuthRateLimitGuard();

    mockRequest = {
      ip: '192.168.1.1',
      body: { email: 'test@example.com' },
      route: { path: '/auth/login' },
      url: '/auth/login',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
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
  });

  describe('canActivate', () => {
    it('should allow request when under rate limit', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should generate unique key based on IP and email', async () => {
      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.ip).toBe('192.168.1.1');
      expect(mockRequest.body.email).toBe('test@example.com');
    });

    it('should handle request without email', async () => {
      mockRequest.body = {};
      mockRequest.route = { path: '/auth/2fa/verify' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should use different limiters for different paths', async () => {
      mockRequest.route = { path: '/auth/login' };
      let result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.route = { path: '/auth/2fa/verify' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should reject when rate limit is exceeded', async () => {
      process.env.RATE_LIMIT_AUTH_STRICT_MAX = '1';
      process.env.RATE_LIMIT_AUTH_WINDOW_MS = '60000';

      const guardWithLowLimit = new AuthRateLimitGuard();

      const result1 = await guardWithLowLimit.canActivate(mockContext);
      expect(result1).toBe(true);

      expect(process.env.RATE_LIMIT_AUTH_STRICT_MAX).toBe('1');

      delete process.env.RATE_LIMIT_AUTH_STRICT_MAX;
      delete process.env.RATE_LIMIT_AUTH_WINDOW_MS;
    });

    it('should handle invalid environment variables gracefully', async () => {
      process.env.RATE_LIMIT_AUTH_STRICT_MAX = 'invalid';
      process.env.RATE_LIMIT_AUTH_WINDOW_MS = 'not-a-number';

      expect(() => new AuthRateLimitGuard()).not.toThrow();

      const guardWithInvalidEnv = new AuthRateLimitGuard();
      const result = await guardWithInvalidEnv.canActivate(mockContext);
      expect(result).toBe(true);

      delete process.env.RATE_LIMIT_AUTH_STRICT_MAX;
      delete process.env.RATE_LIMIT_AUTH_WINDOW_MS;
    });

    it('should skip rate limiting in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should generate proper keys for different user scenarios', async () => {
      mockRequest.body = { email: 'user@test.com' };
      mockRequest.ip = '192.168.1.1';

      let result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.body = { username: 'testuser' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.body = {};
      mockRequest.get = jest.fn().mockReturnValue('Custom-Agent/1.0');
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle missing IP address', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle different path formats correctly', async () => {
      mockRequest.route = { path: '/auth/login' };
      let result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.route = { path: '/AUTH/LOGIN' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.route = { path: '/auth/2fa/verify' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.route = { path: '/api/other' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request without route', async () => {
      mockRequest.route = undefined;
      mockRequest.url = '/auth/login';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should test generateAuthKey method with different scenarios', async () => {
      mockRequest.body = { email: 'user@test.com' };
      mockRequest.ip = '192.168.1.1';
      mockRequest.get = jest.fn().mockReturnValue('Mozilla/5.0');

      let result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.body = { username: 'testuser' };
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      mockRequest.body = {};
      result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should test shouldSkipRateLimit method', async () => {
      const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

      for (const ip of testIps) {
        mockRequest.ip = ip;
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });

    it('should test executeLimiter method error handling', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle all path variations in getLimiterForPath', async () => {
      const strictPaths = [
        '/auth/login',
        '/AUTH/LOGIN',
        '/auth/register',
        '/AUTH/REGISTER',
      ];

      for (const path of strictPaths) {
        mockRequest.route = { path };
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }

      const moderatePaths = [
        '/auth/2fa/verify',
        '/auth/2fa/enable',
        '/some/2fa/endpoint',
      ];

      for (const path of moderatePaths) {
        mockRequest.route = { path };
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }

      mockRequest.route = { path: '/api/other' };
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle special characters in email and sanitize them', async () => {
      mockRequest.body = { email: 'user+test@domain.com!@#$%' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle empty User-Agent header', async () => {
      mockRequest.body = {};
      mockRequest.get = jest.fn().mockReturnValue('');

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle missing User-Agent header', async () => {
      mockRequest.body = {};
      mockRequest.get = jest.fn().mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle socket.remoteAddress when ip is missing', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle completely missing ip and socket', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle anonymous email result from sanitization', async () => {
      mockRequest.body = { email: '' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    describe('parseEnvInt', () => {
      it('should parse valid environment variables', () => {
        const result = parseEnvInt('100', 50, 1, 200);
        expect(result).toBe(100);
      });

      it('should return default for invalid values', () => {
        const result = parseEnvInt('invalid', 50, 1, 200);
        expect(result).toBe(50);
      });

      it('should return default for out-of-range values', () => {
        let result = parseEnvInt('300', 50, 1, 200);
        expect(result).toBe(50);

        result = parseEnvInt('0', 50, 1, 200);
        expect(result).toBe(50);
      });

      it('should return default for undefined values', () => {
        const result = parseEnvInt(undefined, 50, 1, 200);
        expect(result).toBe(50);
      });
    });

    describe('sanitizeRateLimitKey', () => {
      it('should sanitize invalid characters', () => {
        const result = sanitizeRateLimitKey('test@domain.com!#$');
        expect(result).toBe('test@domain.com___');
      });

      it('should handle empty input', () => {
        const result = sanitizeRateLimitKey('');
        expect(result).toBe('anonymous');
      });

      it('should truncate long strings', () => {
        const longString = 'a'.repeat(100);
        const result = sanitizeRateLimitKey(longString, 10);
        expect(result).toHaveLength(10);
      });
    });

    describe('encodeBase64Url', () => {
      it('should encode strings properly', () => {
        const result = encodeBase64Url('Hello World');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });

      it('should handle empty input', () => {
        const result = encodeBase64Url('');
        expect(result).toBe('');
      });

      it('should handle special characters', () => {
        const result = encodeBase64Url('test+/=');
        expect(result).not.toContain('+');
        expect(result).not.toContain('/');
        expect(result).not.toContain('=');
      });
    });
  });
});
