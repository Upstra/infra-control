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
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      delete process.env.NODE_ENV;
    });
  });
});
