import { Test, TestingModule } from '@nestjs/testing';
import { PingIloUseCase } from '../ping-ilo.use-case';
import { PingService } from '@/core/services/ping';

describe('PingIloUseCase', () => {
  let useCase: PingIloUseCase;
  let pingService: jest.Mocked<PingService>;

  beforeEach(async () => {
    const mockPingService = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PingIloUseCase,
        {
          provide: PingService,
          useValue: mockPingService,
        },
      ],
    }).compile();

    useCase = module.get<PingIloUseCase>(PingIloUseCase);
    pingService = module.get(PingService);
  });

  describe('execute', () => {
    it('should ping iLO successfully', async () => {
      const iloId = 'ilo-123';
      const host = '192.168.1.100';
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 12,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(iloId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should ping iLO with custom timeout', async () => {
      const iloId = 'ilo-123';
      const host = '192.168.1.100';
      const timeout = 8000;
      const expectedResult = {
        accessible: true,
        host,
        responseTime: 18,
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(iloId, host, timeout);

      expect(pingService.ping).toHaveBeenCalledWith(host, timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure for iLO', async () => {
      const iloId = 'ilo-123';
      const host = 'unreachable-ilo';
      const expectedResult = {
        accessible: false,
        host,
        error: 'iLO not responding',
      };

      pingService.ping.mockResolvedValue(expectedResult);

      const result = await useCase.execute(iloId, host);

      expect(pingService.ping).toHaveBeenCalledWith(host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});