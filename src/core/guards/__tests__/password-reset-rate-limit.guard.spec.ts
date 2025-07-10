import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { PasswordResetRateLimitGuard } from '../password-reset-rate-limit.guard';

describe('PasswordResetRateLimitGuard', () => {
  let guard: PasswordResetRateLimitGuard;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordResetRateLimitGuard],
    }).compile();

    guard = module.get<PasswordResetRateLimitGuard>(
      PasswordResetRateLimitGuard,
    );

    mockRequest = {
      ip: '127.0.0.1',
      body: {
        email: 'test@example.com',
      },
      route: {
        path: '/auth/forgot-password',
      },
      method: 'POST',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow requests in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should skip rate limiting for localhost IPs', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '::1';

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should use both IP and email for rate limit key', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '192.168.1.1';
      mockRequest.body.email = 'user@example.com';

      await guard.canActivate(mockExecutionContext);

      // The key should include both IP and email
      expect(mockResponse.setHeader).toHaveBeenCalled();
      const headers = mockResponse.setHeader.mock.calls;
      const rateLimitRemainingHeader = headers.find(
        (call) => call[0] === 'RateLimit-Remaining',
      );
      expect(rateLimitRemainingHeader).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should use only IP when email is not provided', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '192.168.1.1';
      mockRequest.body = {};

      await guard.canActivate(mockExecutionContext);

      expect(mockResponse.setHeader).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should set rate limit headers correctly', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '192.168.1.1';

      await guard.canActivate(mockExecutionContext);

      expect(mockResponse.setHeader).toHaveBeenCalled();

      // Check that rate limit headers are set
      const headers = mockResponse.setHeader.mock.calls;
      const limitHeader = headers.find((call) => call[0] === 'RateLimit-Limit');
      const remainingHeader = headers.find(
        (call) => call[0] === 'RateLimit-Remaining',
      );

      expect(limitHeader).toBeDefined();
      expect(remainingHeader).toBeDefined();
      expect(limitHeader[1]).toBeDefined();
      expect(remainingHeader[1]).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
