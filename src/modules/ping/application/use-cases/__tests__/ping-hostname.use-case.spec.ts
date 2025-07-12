import { BadRequestException } from '@nestjs/common';
import { PingHostnameUseCase } from '../ping-hostname.use-case';
import { PingService } from '../../../domain/services/ping.service';

describe('PingHostnameUseCase', () => {
  let useCase: PingHostnameUseCase;
  let pingService: jest.Mocked<PingService>;

  beforeEach(() => {
    pingService = {
      pingHost: jest.fn().mockResolvedValue({
        success: true,
        responseTime: 20,
      }),
    } as any;

    useCase = new PingHostnameUseCase(pingService);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully ping a valid IP address', async () => {
      const hostname = '192.168.1.100';
      const mockResult = {
        success: true,
        responseTime: 15,
      };

      pingService.pingHost.mockResolvedValue(mockResult);

      const result = await useCase.execute(hostname);

      expect(result).toEqual({
        host: hostname,
        accessible: true,
        responseTime: 15,
        error: undefined,
      });
      expect(pingService.pingHost).toHaveBeenCalledWith(hostname);
    });

    it('should handle ping failure', async () => {
      const hostname = '192.168.1.100';
      const mockResult = {
        success: false,
        error: 'Host unreachable',
      };

      pingService.pingHost.mockResolvedValue(mockResult);

      const result = await useCase.execute(hostname);

      expect(result).toEqual({
        host: hostname,
        accessible: false,
        error: 'Host unreachable',
        responseTime: undefined,
      });
    });

    it('should throw BadRequestException for invalid hostname or IP', async () => {
      await expect(useCase.execute('256.256.256.256')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute('999.999.999.999')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute('')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(' ')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute('invalid_hostname')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute('host name with spaces')).rejects.toThrow(BadRequestException);
    });

    it('should accept valid hostnames', async () => {
      const validHostnames = [
        'example.com',
        'sub.example.com',
        'test-server',
        'server123',
      ];

      pingService.pingHost.mockResolvedValue({
        success: true,
        responseTime: 20,
      });

      for (const hostname of validHostnames) {
        const result = await useCase.execute(hostname);
        expect(result.accessible).toBe(true);
      }
    });

    it('should throw BadRequestException for invalid hostnames', async () => {
      const invalidHostnames = [
        'example..com',
        '.example.com',
        'example.com.',
        'exam ple.com',
        '-example.com',
      ];

      for (const hostname of invalidHostnames) {
        await expect(useCase.execute(hostname)).rejects.toThrow(BadRequestException);
      }
    });
  });
});