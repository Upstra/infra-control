import { Test, TestingModule } from '@nestjs/testing';
import { UpsBatteryDomainService } from '../ups-battery.domain.service';

describe('UpsBatteryDomainService', () => {
  let service: UpsBatteryDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsBatteryDomainService],
    }).compile();

    service = module.get<UpsBatteryDomainService>(UpsBatteryDomainService);
  });

  describe('calculateAlertLevel', () => {
    it('should return critical for 5 minutes or less', () => {
      expect(service.calculateAlertLevel(5)).toBe('critical');
      expect(service.calculateAlertLevel(3)).toBe('critical');
      expect(service.calculateAlertLevel(0)).toBe('critical');
    });

    it('should return warning for 6-15 minutes', () => {
      expect(service.calculateAlertLevel(6)).toBe('warning');
      expect(service.calculateAlertLevel(10)).toBe('warning');
      expect(service.calculateAlertLevel(15)).toBe('warning');
    });

    it('should return low for 16-30 minutes', () => {
      expect(service.calculateAlertLevel(16)).toBe('low');
      expect(service.calculateAlertLevel(25)).toBe('low');
      expect(service.calculateAlertLevel(30)).toBe('low');
    });

    it('should return normal for more than 30 minutes', () => {
      expect(service.calculateAlertLevel(31)).toBe('normal');
      expect(service.calculateAlertLevel(60)).toBe('normal');
      expect(service.calculateAlertLevel(120)).toBe('normal');
    });
  });

  describe('enrichBatteryStatus', () => {
    const upsId = '123e4567-e89b-12d3-a456-426614174000';
    const ip = '192.168.1.100';

    it('should enrich battery status with normal level', () => {
      const result = service.enrichBatteryStatus(upsId, ip, 120);

      expect(result).toMatchObject({
        upsId,
        ip,
        minutesRemaining: 120,
        hoursRemaining: 2,
        alertLevel: 'normal',
        statusLabel: 'Normal',
        timestamp: expect.any(Date),
      });
    });

    it('should enrich battery status with critical level', () => {
      const result = service.enrichBatteryStatus(upsId, ip, 3);

      expect(result).toMatchObject({
        upsId,
        ip,
        minutesRemaining: 3,
        hoursRemaining: 0.05,
        alertLevel: 'critical',
        statusLabel: 'Critique - Action immédiate requise',
        timestamp: expect.any(Date),
      });
    });

    it('should enrich battery status with warning level', () => {
      const result = service.enrichBatteryStatus(upsId, ip, 10);

      expect(result).toMatchObject({
        upsId,
        ip,
        minutesRemaining: 10,
        hoursRemaining: 0.17,
        alertLevel: 'warning',
        statusLabel: 'Avertissement - Préparer shutdown',
        timestamp: expect.any(Date),
      });
    });

    it('should enrich battery status with low level', () => {
      const result = service.enrichBatteryStatus(upsId, ip, 25);

      expect(result).toMatchObject({
        upsId,
        ip,
        minutesRemaining: 25,
        hoursRemaining: 0.42,
        alertLevel: 'low',
        statusLabel: 'Faible - Surveillance accrue',
        timestamp: expect.any(Date),
      });
    });

    it('should calculate hours remaining correctly', () => {
      const testCases = [
        { minutes: 30, expectedHours: 0.5 },
        { minutes: 45, expectedHours: 0.75 },
        { minutes: 60, expectedHours: 1 },
        { minutes: 90, expectedHours: 1.5 },
        { minutes: 125, expectedHours: 2.08 },
      ];

      for (const testCase of testCases) {
        const result = service.enrichBatteryStatus(upsId, ip, testCase.minutes);
        expect(result.hoursRemaining).toBe(testCase.expectedHours);
      }
    });

    it('should handle zero minutes', () => {
      const result = service.enrichBatteryStatus(upsId, ip, 0);

      expect(result).toMatchObject({
        minutesRemaining: 0,
        hoursRemaining: 0,
        alertLevel: 'critical',
        statusLabel: 'Critique - Action immédiate requise',
      });
    });

    it('should create unique timestamps', async () => {
      const result1 = service.enrichBatteryStatus(upsId, ip, 60);

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = service.enrichBatteryStatus(upsId, ip, 60);

      expect(result1.timestamp).not.toEqual(result2.timestamp);
    });
  });

  describe('private getStatusLabel', () => {
    it('should return correct labels for all alert levels', () => {
      const testCases = [
        { minutes: 3, expectedLabel: 'Critique - Action immédiate requise' },
        { minutes: 10, expectedLabel: 'Avertissement - Préparer shutdown' },
        { minutes: 25, expectedLabel: 'Faible - Surveillance accrue' },
        { minutes: 60, expectedLabel: 'Normal' },
      ];

      for (const testCase of testCases) {
        const result = service.enrichBatteryStatus(
          'id',
          'ip',
          testCase.minutes,
        );
        expect(result.statusLabel).toBe(testCase.expectedLabel);
      }
    });
  });
});
