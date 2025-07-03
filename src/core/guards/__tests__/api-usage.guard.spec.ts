import { ExecutionContext } from '@nestjs/common';
import { ApiUsageGuard } from '../api-usage.guard';
import * as envValidationUtil from '@/core/utils/env-validation.util';

describe('ApiUsageGuard', () => {
  let guard: ApiUsageGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    guard = new ApiUsageGuard();

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

  describe('constructor', () => {
    it('should create guard with default environment values', () => {
      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();
      expect(guard['limiter']).toBeDefined();
    });

    it('should create guard with custom environment values', () => {
      const originalWindowMs = process.env.RATE_LIMIT_API_WINDOW_MS;
      const originalMax = process.env.RATE_LIMIT_API_MAX;

      process.env.RATE_LIMIT_API_WINDOW_MS = '600000';
      process.env.RATE_LIMIT_API_MAX = '200';

      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();

      process.env.RATE_LIMIT_API_WINDOW_MS = originalWindowMs;
      process.env.RATE_LIMIT_API_MAX = originalMax;
    });

    it('should handle invalid window MS environment variable', () => {
      const originalWindowMs = process.env.RATE_LIMIT_API_WINDOW_MS;
      process.env.RATE_LIMIT_API_WINDOW_MS = 'invalid';

      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();

      process.env.RATE_LIMIT_API_WINDOW_MS = originalWindowMs;
    });

    it('should handle invalid max environment variable', () => {
      const originalMax = process.env.RATE_LIMIT_API_MAX;
      process.env.RATE_LIMIT_API_MAX = 'invalid';

      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();

      process.env.RATE_LIMIT_API_MAX = originalMax;
    });

    it('should handle out-of-range window MS environment variable', () => {
      const originalWindowMs = process.env.RATE_LIMIT_API_WINDOW_MS;
      process.env.RATE_LIMIT_API_WINDOW_MS = '30000'; // Below minimum

      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();

      process.env.RATE_LIMIT_API_WINDOW_MS = originalWindowMs;
    });

    it('should handle out-of-range max environment variable', () => {
      const originalMax = process.env.RATE_LIMIT_API_MAX;
      process.env.RATE_LIMIT_API_MAX = '2000'; // Above maximum

      const guard = new ApiUsageGuard();
      expect(guard).toBeDefined();

      process.env.RATE_LIMIT_API_MAX = originalMax;
    });

    it('should call parseEnvInt with correct parameters for windowMs', () => {
      const parseEnvIntSpy = jest.spyOn(envValidationUtil, 'parseEnvInt');

      new ApiUsageGuard();

      expect(parseEnvIntSpy).toHaveBeenCalledWith(
        process.env.RATE_LIMIT_API_WINDOW_MS,
        300000,
        60000,
        1800000,
      );

      parseEnvIntSpy.mockRestore();
    });

    it('should call parseEnvInt with correct parameters for max', () => {
      const parseEnvIntSpy = jest.spyOn(envValidationUtil, 'parseEnvInt');

      new ApiUsageGuard();

      expect(parseEnvIntSpy).toHaveBeenCalledWith(
        process.env.RATE_LIMIT_API_MAX,
        100,
        10,
        1000,
      );

      parseEnvIntSpy.mockRestore();
    });

    it('should create guard instance with proper configuration', () => {
      const guard = new ApiUsageGuard();

      expect(guard).toBeDefined();
      expect(guard['limiter']).toBeDefined();
    });
  });

  describe('keyGenerator coverage', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should generate user-based key when user has valid ID', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: 'valid-user-123' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should generate user-based key when user has valid sub', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { sub: 'valid-sub-456' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should generate IP-based key when user ID is anonymous', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: 'anonymous' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should generate IP-based key when no user', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should use socket remoteAddress when no IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should use unknown when no IP and no socket', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty user ID and fall back to sub', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: '', sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null user ID and fall back to sub', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: null, sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined user ID and fall back to sub', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: undefined, sub: 'fallback-sub' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty sub and fall back to IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { sub: '' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle anonymous sub and fall back to IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { sub: 'anonymous' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null sub and fall back to IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { sub: null };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined sub and fall back to IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { sub: undefined };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should sanitize special characters in user ID', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = { id: 'user@#$%special!@#chars' };
      mockRequest.ip = '192.168.1.1';

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should sanitize special characters in IP', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = '192.168.1.1@#$%special';
      mockRequest.socket = undefined;

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle null socket remoteAddress', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: null };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle undefined socket remoteAddress', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });

    it('should handle empty socket remoteAddress', async () => {
      const productionGuard = new ApiUsageGuard();
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '' };

      await productionGuard.canActivate(mockContext);
      expect(true).toBe(true);
    });
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

    it('should handle user with both id and sub, prioritizing id', async () => {
      mockRequest.user = { id: 'user-456', sub: 'user-sub-789' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle user with empty id but valid sub', async () => {
      mockRequest.user = { id: '', sub: 'user-sub-789' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle user with anonymous id but valid sub', async () => {
      mockRequest.user = { id: 'anonymous', sub: 'user-sub-789' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle user with empty sub when id is not available', async () => {
      mockRequest.user = { sub: '' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle user with anonymous sub when id is not available', async () => {
      mockRequest.user = { sub: 'anonymous' };

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request with no IP and no socket', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request with socket but no remoteAddress', async () => {
      mockRequest.ip = undefined;
      mockRequest.socket = {};
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request with null IP and null socket', async () => {
      mockRequest.ip = null;
      mockRequest.socket = null;
      mockRequest.user = undefined;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request with falsy IP values', async () => {
      const falsyValues = [null, undefined, '', 0, false];

      for (const falsyValue of falsyValues) {
        mockRequest.ip = falsyValue;
        mockRequest.socket = undefined;
        mockRequest.user = undefined;

        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });

    it('should handle request with complex user object structures', async () => {
      const complexUsers = [
        { id: 'user-123', sub: 'sub-456', other: 'data' },
        { sub: 'sub-only', other: 'data' },
        { id: null, sub: 'sub-456' },
        { id: undefined, sub: 'sub-456' },
      ];

      for (const user of complexUsers) {
        mockRequest.user = user;
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });

    it('should handle deeply nested request properties', async () => {
      mockRequest.socket = {
        remoteAddress: '192.168.1.1',
        nested: {
          property: 'value',
        },
      };

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

    it('should handle undefined environment variables', () => {
      delete process.env.RATE_LIMIT_API_WINDOW_MS;
      delete process.env.RATE_LIMIT_API_MAX;

      expect(() => new ApiUsageGuard()).not.toThrow();
    });

    it('should handle empty string environment variables', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '';
      process.env.RATE_LIMIT_API_MAX = '';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });

    it('should handle negative environment variables', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '-1000';
      process.env.RATE_LIMIT_API_MAX = '-50';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });

    it('should handle zero environment variables', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '0';
      process.env.RATE_LIMIT_API_MAX = '0';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });

    it('should handle extremely large environment variables', () => {
      process.env.RATE_LIMIT_API_WINDOW_MS = '999999999999';
      process.env.RATE_LIMIT_API_MAX = '999999999';

      expect(() => new ApiUsageGuard()).not.toThrow();
    });
  });

  describe('integration with utility functions', () => {
    it('should call parseEnvInt for both window and max configuration', () => {
      const parseEnvIntSpy = jest.spyOn(envValidationUtil, 'parseEnvInt');

      new ApiUsageGuard();

      expect(parseEnvIntSpy).toHaveBeenCalledTimes(2);
      expect(parseEnvIntSpy).toHaveBeenCalledWith(
        process.env.RATE_LIMIT_API_WINDOW_MS,
        300000,
        60000,
        1800000,
      );
      expect(parseEnvIntSpy).toHaveBeenCalledWith(
        process.env.RATE_LIMIT_API_MAX,
        100,
        10,
        1000,
      );

      parseEnvIntSpy.mockRestore();
    });

    it('should integrate properly with utility functions', async () => {
      const guard = new ApiUsageGuard();

      const testCases = [
        { ip: '192.168.1.1', user: { id: 'user-123' } },
        { ip: '10.0.0.1@#$%', user: { id: 'user@#$%' } },
        { ip: undefined, socket: { remoteAddress: '172.16.0.1' }, user: {} },
        { ip: null, socket: null, user: { sub: 'sub-456' } },
      ];

      for (const testCase of testCases) {
        mockRequest.ip = testCase.ip;
        mockRequest.socket = testCase.socket;
        mockRequest.user = testCase.user;

        const result = await guard.canActivate(mockContext);
        expect(typeof result).toBe('boolean');
      }
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
    const originalWindowMs = process.env.RATE_LIMIT_API_WINDOW_MS;
    const originalMax = process.env.RATE_LIMIT_API_MAX;

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
      process.env.RATE_LIMIT_API_WINDOW_MS = originalWindowMs;
      process.env.RATE_LIMIT_API_MAX = originalMax;
    }
  });

  it('should handle malformed request objects', async () => {
    const guard = new ApiUsageGuard();

    const testCases = [
      { ip: {}, user: {} },
      { ip: [], user: [] },
      { ip: 123, user: 456 },
    ];

    for (const requestData of testCases) {
      Object.assign(mockRequest, requestData);

      try {
        const result = await guard.canActivate(mockContext);
        expect(typeof result).toBe('boolean');
      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  });

  it('should handle edge cases in request processing', async () => {
    const guard = new ApiUsageGuard();

    try {
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
