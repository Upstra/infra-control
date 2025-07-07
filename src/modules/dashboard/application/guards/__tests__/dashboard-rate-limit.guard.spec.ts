import { ExecutionContext } from '@nestjs/common';
import { DashboardRateLimitGuard } from '../dashboard-rate-limit.guard';

describe('DashboardRateLimitGuard', () => {
  let guard: DashboardRateLimitGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    guard = new DashboardRateLimitGuard();
    
    mockRequest = {
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' },
      user: { id: 'user-123' },
      path: '/dashboard/widgets',
      route: { path: '/dashboard/widgets' },
      url: '/dashboard/widgets',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow requests in test environment', async () => {
      process.env.NODE_ENV = 'test';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow requests from localhost IPs', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '127.0.0.1';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow requests from IPv6 localhost', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '::1';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow requests from IPv6 mapped localhost', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '::ffff:127.0.0.1';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should use widget limiter for widget paths', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_DASHBOARD_WIDGET_MAX = '200';
      
      mockRequest.path = '/dashboard/widgets/stats';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should use API limiter for non-widget paths', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_DASHBOARD_API_MAX = '100';
      
      mockRequest.path = '/dashboard/layouts';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle missing user ID gracefully', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.user = null;
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle missing IP address gracefully', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = undefined;
      mockRequest.socket.remoteAddress = undefined;
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle missing path gracefully', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.path = undefined;
      mockRequest.route = undefined;
      mockRequest.url = undefined;
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should normalize paths with multiple slashes', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.path = '/dashboard//widgets///stats';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle case-insensitive widget path detection', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.path = '/dashboard/WIDGETS/stats';
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should use default values when env vars are not set', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS;
      delete process.env.RATE_LIMIT_DASHBOARD_API_MAX;
      delete process.env.RATE_LIMIT_DASHBOARD_WIDGET_MAX;
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle rate limiter errors gracefully', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock the rate limiter to throw an error
      const mockError = new Error('Rate limiter error');
      const originalLimiter = (guard as any).apiLimiter;
      (guard as any).apiLimiter = jest.fn().mockImplementation((req, res, cb) => {
        cb(mockError);
      });
      
      await expect(guard.canActivate(mockContext)).rejects.toThrow(mockError);
      
      (guard as any).apiLimiter = originalLimiter;
    });

    it('should handle non-Error exceptions in rate limiter', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock the rate limiter to throw a non-Error
      const originalLimiter = (guard as any).apiLimiter;
      (guard as any).apiLimiter = jest.fn().mockImplementation((req, res, cb) => {
        cb('String error');
      });
      
      await expect(guard.canActivate(mockContext)).rejects.toThrow('String error');
      
      (guard as any).apiLimiter = originalLimiter;
    });

    it('should generate correct key for dashboard requests', async () => {
      process.env.NODE_ENV = 'production';
      
      const generateKeyMethod = (guard as any).generateDashboardKey;
      const key = generateKeyMethod.call(guard, mockRequest);
      
      expect(key).toBe('dashboard:192.168.1.100:user-123:/dashboard/widgets');
    });

    it('should generate key with anonymous user when user is not authenticated', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.user = null;
      
      const generateKeyMethod = (guard as any).generateDashboardKey;
      const key = generateKeyMethod.call(guard, mockRequest);
      
      expect(key).toBe('dashboard:192.168.1.100:anonymous:/dashboard/widgets');
    });

    it('should handle socket remoteAddress when ip is not available', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = undefined;
      mockRequest.socket.remoteAddress = '10.0.0.1';
      
      const generateKeyMethod = (guard as any).generateDashboardKey;
      const key = generateKeyMethod.call(guard, mockRequest);
      
      expect(key).toBe('dashboard:10.0.0.1:user-123:/dashboard/widgets');
    });

    it('should use unknown when no IP is available', async () => {
      process.env.NODE_ENV = 'production';
      mockRequest.ip = undefined;
      mockRequest.socket = {};
      
      const generateKeyMethod = (guard as any).generateDashboardKey;
      const key = generateKeyMethod.call(guard, mockRequest);
      
      expect(key).toBe('dashboard:unknown:user-123:/dashboard/widgets');
    });
  });
});