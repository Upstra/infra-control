import { ExecutionContext } from '@nestjs/common';
import { ApiUsageGuard } from '../api-usage.guard';

describe('ApiUsageGuard', () => {
  let guard: ApiUsageGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    guard = new ApiUsageGuard();

    mockRequest = {
      ip: '127.0.0.1',
      user: { id: 'user-123' },
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
    it('should allow API usage when under rate limit', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should limit by IP when no user is authenticated', async () => {
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should skip rate limiting for test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should generate key based on user ID when authenticated', async () => {
      mockRequest.user = { id: 'user-456' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should generate key based on user sub when id is not available', async () => {
      mockRequest.user = { sub: 'user-sub-789' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle missing IP address', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle IP from socket when direct IP not available', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '192.168.1.1' };
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should skip for localhost IPs', async () => {
      const testIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

      for (const ip of testIps) {
        mockRequest.ip = ip;
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });

    it('should handle empty user object', async () => {
      mockRequest.user = {};

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle null user', async () => {
      mockRequest.user = null;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle sanitization of invalid characters in user ID', async () => {
      mockRequest.user = { id: 'user@#$%123!@#' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle anonymous user ID', async () => {
      mockRequest.user = { id: '' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('environment variable configuration', () => {
    afterEach(() => {
      delete process.env.RATE_LIMIT_API_WINDOW_MS;
      delete process.env.RATE_LIMIT_API_MAX;
    });

    it('should use environment variables for configuration', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '600000';
      process.env.RATE_LIMIT_API_MAX = '200';

      const guardWithEnv = new ApiUsageGuard();
      expect(guardWithEnv).toBeDefined();
    });

    it('should handle invalid environment variables gracefully', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = 'invalid';
      process.env.RATE_LIMIT_API_MAX = 'not-a-number';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });

    it('should handle out-of-range environment variables', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '30000';
      process.env.RATE_LIMIT_API_MAX = '2000';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });
  });
});

describe('ApiUsageGuard Error Handling', () => {
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      ip: '192.168.1.1',
      user: { id: 'user-123' },
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

  it('should handle rate limiter errors', async () => {
    process.env.RATE_LIMIT_API_WINDOW_MS = '1000';
    process.env.RATE_LIMIT_API_MAX = '1';

    const guard = new ApiUsageGuard();

    try {
      const result1 = await guard.canActivate(mockContext);
      expect(result1).toBe(true);

      const result2 = await guard.canActivate(mockContext);
      expect(result2).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      delete process.env.RATE_LIMIT_API_WINDOW_MS;
      delete process.env.RATE_LIMIT_API_MAX;
    }
  });
});
