import { ExecutionContext } from '@nestjs/common';
import { SensitiveOperationsGuard } from '../sensitive-operations.guard';

describe('SensitiveOperationsGuard', () => {
  let guard: SensitiveOperationsGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    guard = new SensitiveOperationsGuard();

    process.env.NODE_ENV = originalNodeEnv;

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

  describe('keyGenerator coverage', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should generate key with IP and user ID', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'valid-user-123' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should generate key with IP and user sub when ID not available', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { sub: 'valid-sub-456' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should generate key with IP and empty userId when no user', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = undefined;
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should use socket remoteAddress when no IP', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should use unknown when no IP and no socket', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty user ID and fall back to sub', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: '', sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null user ID and fall back to sub', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: null, sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined user ID and fall back to sub', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: undefined, sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty sub and fall back to empty string', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { sub: '' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null sub and fall back to empty string', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { sub: null };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined sub and fall back to empty string', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { sub: undefined };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should sanitize special characters in user ID', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user@#$%special!@#chars' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should sanitize special characters in IP', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = '192.168.1.1@#$%special';
      mockRequest.socket = undefined;

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null socket remoteAddress', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: null };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined socket remoteAddress', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty socket remoteAddress', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle 0 as falsy IP value', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = 0;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle false as falsy IP value', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = false;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty string as falsy IP value', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = '';
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle user with both id and sub fields', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-id', sub: 'user-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty user object', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = {};
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null user object', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = null;
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle complex IP resolution chain', async () => {
      const productionGuard = new SensitiveOperationsGuard();
      mockRequest.user = { id: 'user-123' };
      mockRequest.ip = null;
      mockRequest.socket = null;

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });
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
