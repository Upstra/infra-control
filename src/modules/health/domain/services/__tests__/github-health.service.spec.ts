import { Test, TestingModule } from '@nestjs/testing';
import { GitHubHealthService } from '../github-health.service';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('GitHubHealthService', () => {
  let service: GitHubHealthService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitHubHealthService],
    }).compile();

    service = module.get<GitHubHealthService>(GitHubHealthService);

    // Store original environment
    originalEnv = { ...process.env };

    // Reset mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('checkHealth', () => {
    it('should return healthy status when GitHub API is accessible', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('Keep it logically awesome.'),
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-ratelimit-remaining':
                return '4999';
              case 'x-ratelimit-reset':
                return '1234567890';
              default:
                return null;
            }
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'up',
        message: 'GitHub API is accessible',
        responseTime: expect.any(Number),
        details: {
          statusCode: 200,
          rateLimit: '4999',
          rateLimitReset: '1234567890',
          zen: 'Keep it logically awesome....',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/zen',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            'User-Agent': 'InfraControl-HealthCheck',
          },
        }),
      );
    });

    it('should return unknown status when GitHub token is not configured', async () => {
      delete process.env.GITHUB_TOKEN;

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'unknown',
        message: 'GitHub API token not configured',
        responseTime: expect.any(Number),
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return down status when GitHub API returns error status', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: jest.fn(),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'down',
        message: 'GitHub API returned 401: Unauthorized',
        responseTime: expect.any(Number),
        details: {
          statusCode: 401,
          statusText: 'Unauthorized',
        },
      });
    });

    it('should handle network errors gracefully', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'down',
        message: 'GitHub API error: Network error',
        responseTime: expect.any(Number),
        details: {
          error: 'Network error',
        },
      });
    });

    it('should handle timeout errors', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'down',
        message: 'GitHub API request timed out',
        responseTime: expect.any(Number),
        details: {
          error: 'Request timeout',
          timeout: 5000,
        },
      });
    });

    it('should handle AbortError when timeout occurs', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await service.checkHealth();

      expect(result.status).toBe('down');
      expect(result.message).toBe('GitHub API request timed out');
      expect(result.details.error).toBe('Request timeout');
      expect(result.details.timeout).toBe(5000);
    });

    it('should handle empty GitHub token', async () => {
      process.env.GITHUB_TOKEN = '';

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'github',
        status: 'unknown',
        message: 'GitHub API token not configured',
        responseTime: expect.any(Number),
      });
    });

    it('should truncate long zen messages', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const longZenMessage = 'A'.repeat(100);
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(longZenMessage),
        headers: {
          get: jest.fn(() => null),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkHealth();

      expect(result.details.zen).toHaveLength(53); // 50 chars + '...'
      expect(result.details.zen.endsWith('...')).toBe(true);
    });

    it('should handle rate limit headers gracefully when missing', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('Zen message'),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkHealth();

      expect(result.details).toEqual({
        statusCode: 200,
        rateLimit: null,
        rateLimitReset: null,
        zen: 'Zen message...',
      });
    });

    it('should measure response time accurately', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('Zen message'),
        headers: {
          get: jest.fn(() => null),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkHealth();

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.responseTime).toBeLessThan(1000);
      expect(typeof result.responseTime).toBe('number');
    });
  });
});
