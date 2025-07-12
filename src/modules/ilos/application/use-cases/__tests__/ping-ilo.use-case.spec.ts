import { Test, TestingModule } from '@nestjs/testing';
import { PingIloUseCase } from '../ping-ilo.use-case';
import { PingService } from '@/core/services/ping';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';

describe('PingIloUseCase', () => {
  let useCase: PingIloUseCase;
  let pingService: jest.Mocked<PingService>;
  let getServerWithIloUseCase: jest.Mocked<GetServerWithIloUseCase>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const mockGetServerWithIloUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingIloUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
        {
          provide: GetServerWithIloUseCase,
          useValue: mockGetServerWithIloUseCase,
        },
      ],
    }).compile();

    useCase = module.get<PingIloUseCase>(PingIloUseCase);
    pingService = module.get(PingService);
    getServerWithIloUseCase = module.get(GetServerWithIloUseCase);
  });

  describe('execute', () => {
    it('should ping iLO successfully', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.100';
      const mockServer = {
        ilo: { ip: host },
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 12,
      };

      getServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId);

      expect(getServerWithIloUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping iLO with custom timeout', async () => {
      const serverId = 'server-123';
      const host = '192.168.1.100';
      const timeout = 8000;
      const mockServer = {
        ilo: { ip: host },
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 18,
      };

      getServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId, timeout);

      expect(getServerWithIloUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure for iLO', async () => {
      const serverId = 'server-123';
      const host = 'unreachable-ilo';
      const mockServer = {
        ilo: { ip: host },
      };
      const expectedResult = {
        accessible: false,
        host,
        error: 'iLO not responding',
      };

      getServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(serverId);

      expect(getServerWithIloUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});
