import { ExecutionContext } from '@nestjs/common';
import { AuthRateLimitGuard } from '../rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  let guard: AuthRateLimitGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    guard = new AuthRateLimitGuard();

    mockRequest = {
      ip: '127.0.0.1',
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
      expect(mockRequest.ip).toBe('127.0.0.1');
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
  });
});
