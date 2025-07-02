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
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      delete process.env.NODE_ENV;
    });
  });
});
