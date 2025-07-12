import { Test, TestingModule } from '@nestjs/testing';
import { PingServerUseCase } from '../ping-server.use-case';
import { PingService } from '@/core/services/ping';
import { GetServerByIdUseCase } from '../get-server-by-id.use-case';

describe('PingServerUseCase', () => {
  let useCase: PingServerUseCase;
  let pingService: jest.Mocked<PingService>;
  let getServerByIdUseCase: jest.Mocked<GetServerByIdUseCase>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const mockGetServerByIdUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingServerUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
        {
          provide: GetServerByIdUseCase,
          useValue: mockGetServerByIdUseCase,
        },
      ],
    }).compile();

    useCase = module.get<PingServerUseCase>(PingServerUseCase);
    pingService = module.get(PingService);
    getServerByIdUseCase = module.get(GetServerByIdUseCase);
  });

  describe('execute', () => {
    it('should ping server successfully', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.10';
      const mockServer = {
        ip: host
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 15,
      };

      getServerByIdUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId);

      expect(getServerByIdUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping server with custom timeout', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.10';
      const timeout = 10000;
      const mockServer = {
        ip: host
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 25,
      };

      getServerByIdUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId, timeout);

      expect(getServerByIdUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure', async () => {
      const serverId = 'server-123';
      const host = 'unreachable-host';
      const mockServer = {
        ip: host
      };
      const expectedResult = {
        accessible: false,
        host,
        error: 'Host unreachable',
      };

      getServerByIdUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId);

      expect(getServerByIdUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});