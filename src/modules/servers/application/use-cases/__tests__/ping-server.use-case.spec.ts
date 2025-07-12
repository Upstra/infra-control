import { Test, TestingModule } from '@nestjs/testing';
import { PingServerUseCase } from '../ping-server.use-case';
import { PingService } from '@/core/services/ping';

describe('PingServerUseCase', () => {
  let useCase: PingServerUseCase;
  let pingService: jest.Mocked<PingService>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingServerUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
      ],
    }).compile();

    useCase = module.get<PingServerUseCase>(PingServerUseCase);
    pingService = module.get(PingService);
  });

  describe('execute', () => {
    it('should ping server successfully', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.10';
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 15,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping server with custom timeout', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.10';
      const timeout = 10000;
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 25,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId, host, timeout);

      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure', async () => {
      const serverId = 'server-123';
      const host = 'unreachable-host';
      const expectedResult = {
        accessible: false,
        host,
        error: 'Host unreachable',
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});