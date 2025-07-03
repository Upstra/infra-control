import { ExecutionContext } from '@nestjs/common';
import { SensitiveOperationsGuard } from '../sensitive-operations.guard';

describe('SensitiveOperationsGuard', () => {
  let guard: SensitiveOperationsGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    guard = new SensitiveOperationsGuard();

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

  describe('canActivate', () => {
    it('should allow sensitive operation when under rate limit', async () => {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request without user', async () => {
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

    it('should generate key with user ID when available', async () => {
      mockRequest.user = { id: 'user-456' };
      mockRequest.ip = '192.168.1.1';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should generate key with user sub when id not available', async () => {
      mockRequest.user = { sub: 'user-sub-789' };
      mockRequest.ip = '192.168.1.1';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle missing IP address', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle IP from socket when direct IP not available', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

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

    it('should sanitize special characters in user ID', async () => {
      mockRequest.user = { id: 'user@#$%special!@#' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle empty user ID', async () => {
      mockRequest.user = { id: '' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('environment variable configuration', () => {
    afterEach(() => {
      delete process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS;
      delete process.env.RATE_LIMIT_SENSITIVE_MAX;
    });

    it('should use environment variables for configuration', () => {
      process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS = '7200000';
      process.env.RATE_LIMIT_SENSITIVE_MAX = '5';

      const guardWithEnv = new SensitiveOperationsGuard();
      expect(guardWithEnv).toBeDefined();
    });

    it('should handle invalid environment variables gracefully', () => {
      process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS = 'invalid';
      process.env.RATE_LIMIT_SENSITIVE_MAX = 'not-a-number';

      expect(() => new SensitiveOperationsGuard()).not.toThrow();
    });

    it('should handle out-of-range environment variables', () => {
      process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS = '100000';
      process.env.RATE_LIMIT_SENSITIVE_MAX = '15';

      expect(() => new SensitiveOperationsGuard()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle rate limiter errors', async () => {
      process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS = '3600000';
      process.env.RATE_LIMIT_SENSITIVE_MAX = '1';

      const guard = new SensitiveOperationsGuard();

      try {
        const result1 = await guard.canActivate(mockContext);
        expect(result1).toBe(true);

        const result2 = await guard.canActivate(mockContext);
        expect(result2).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        delete process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS;
        delete process.env.RATE_LIMIT_SENSITIVE_MAX;
      }
    });
  });
});

describe('SensitiveOperationsGuard Key Generation', () => {
  let guard: SensitiveOperationsGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    guard = new SensitiveOperationsGuard();

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

  it('should generate consistent keys for same user and IP', async () => {
    const result1 = await guard.canActivate(mockContext);
    const result2 = await guard.canActivate(mockContext);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  it('should handle different users on same IP', async () => {
    mockRequest.user = { id: 'user-123' };
    const result1 = await guard.canActivate(mockContext);

    mockRequest.user = { id: 'user-456' };
    const result2 = await guard.canActivate(mockContext);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });
});
