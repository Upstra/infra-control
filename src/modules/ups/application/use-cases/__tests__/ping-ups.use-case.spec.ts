import { Test, TestingModule } from '@nestjs/testing';
import { PingUpsUseCase } from '../ping-ups.use-case';
import { PingService } from '@/core/services/ping';
import { GetUpsByIdUseCase } from '../get-ups-by-id.use-case';

describe('PingUpsUseCase', () => {
  let useCase: PingUpsUseCase;
  let pingService: jest.Mocked<PingService>;
  let getUpsByIdUseCase: jest.Mocked<GetUpsByIdUseCase>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const mockGetUpsByIdUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingUpsUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
        {
          provide: GetUpsByIdUseCase,
          useValue: mockGetUpsByIdUseCase,
        },
      ],
    }).compile();

    useCase = module.get<PingUpsUseCase>(PingUpsUseCase);
    pingService = module.get(PingService);
    getUpsByIdUseCase = module.get(GetUpsByIdUseCase);
  });

  describe('execute', () => {
    it('should ping UPS successfully', async () => {
      const upsId = 'ups-123';
      const host = '192.168.1.200';
      const mockUps = {
        ip: host
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 20,
      };

      getUpsByIdUseCase.execute.mockResolvedValue(mockUps as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId);

      expect(getUpsByIdUseCase.execute).toHaveBeenCalledWith(upsId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping UPS with custom timeout', async () => {
      const upsId = 'ups-123';
      const host = '192.168.1.200';
      const timeout = 15000;
      const mockUps = {
        ip: host
      };
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 35,
      };

      getUpsByIdUseCase.execute.mockResolvedValue(mockUps as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId, timeout);

      expect(getUpsByIdUseCase.execute).toHaveBeenCalledWith(upsId);
      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure for UPS', async () => {
      const upsId = 'ups-123';
      const host = 'unreachable-ups';
      const mockUps = {
        ip: host
      };
      const expectedResult = {
        accessible: false,
        host,
        error: 'UPS device not responding',
      };

      getUpsByIdUseCase.execute.mockResolvedValue(mockUps as any);
      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId);

      expect(getUpsByIdUseCase.execute).toHaveBeenCalledWith(upsId);
      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});