import { Test, TestingModule } from '@nestjs/testing';
import { PingUpsUseCase } from '../ping-ups.use-case';
import { PingService } from '@/core/services/ping';

describe('PingUpsUseCase', () => {
  let useCase: PingUpsUseCase;
  let pingService: jest.Mocked<PingService>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingUpsUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
      ],
    }).compile();

    useCase = module.get<PingUpsUseCase>(PingUpsUseCase);
    pingService = module.get(PingService);
  });

  describe('execute', () => {
    it('should ping UPS successfully', async () => {
      const upsId = 'ups-123';
      const host = '192.168.1.200';
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 20,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping UPS with custom timeout', async () => {
      const upsId = 'ups-123';
      const host = '192.168.1.200';
      const timeout = 15000;
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 35,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId, host, timeout);

      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure for UPS', async () => {
      const upsId = 'ups-123';
      const host = 'unreachable-ups';
      const expectedResult = {
        accessible: false,
        host,
        error: 'UPS device not responding',
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(upsId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});