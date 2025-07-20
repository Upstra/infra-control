import { BatteryStatusResponseDto } from '../battery-status.response.dto';

describe('BatteryStatusResponseDto', () => {
  describe('constructor', () => {
    it('should create a DTO with all properties', () => {
      const data = {
        upsId: 'ups-123',
        ip: '192.168.1.100',
        minutesRemaining: 60,
        hoursRemaining: 1,
        alertLevel: 'normal' as const,
        statusLabel: 'Battery Normal',
        timestamp: new Date('2024-01-01T12:00:00Z'),
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.upsId).toBe('ups-123');
      expect(dto.ip).toBe('192.168.1.100');
      expect(dto.minutesRemaining).toBe(60);
      expect(dto.hoursRemaining).toBe(1);
      expect(dto.alertLevel).toBe('normal');
      expect(dto.statusLabel).toBe('Battery Normal');
      expect(dto.timestamp).toEqual(new Date('2024-01-01T12:00:00Z'));
    });

    it('should handle low battery alert level', () => {
      const data = {
        upsId: 'ups-456',
        ip: '10.0.0.1',
        minutesRemaining: 30,
        hoursRemaining: 0.5,
        alertLevel: 'low' as const,
        statusLabel: 'Battery Low',
        timestamp: new Date(),
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.alertLevel).toBe('low');
      expect(dto.minutesRemaining).toBe(30);
    });

    it('should handle warning battery alert level', () => {
      const data = {
        upsId: 'ups-789',
        ip: '172.16.0.1',
        minutesRemaining: 15,
        hoursRemaining: 0.25,
        alertLevel: 'warning' as const,
        statusLabel: 'Battery Warning',
        timestamp: new Date(),
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.alertLevel).toBe('warning');
      expect(dto.minutesRemaining).toBe(15);
    });

    it('should handle critical battery alert level', () => {
      const data = {
        upsId: 'ups-critical',
        ip: '192.168.100.1',
        minutesRemaining: 5,
        hoursRemaining: 0.083,
        alertLevel: 'critical' as const,
        statusLabel: 'Battery Critical - Immediate Action Required',
        timestamp: new Date(),
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.alertLevel).toBe('critical');
      expect(dto.minutesRemaining).toBe(5);
      expect(dto.statusLabel).toBe(
        'Battery Critical - Immediate Action Required',
      );
    });

    it('should handle zero remaining time', () => {
      const data = {
        upsId: 'ups-empty',
        ip: '192.168.1.200',
        minutesRemaining: 0,
        hoursRemaining: 0,
        alertLevel: 'critical' as const,
        statusLabel: 'Battery Depleted',
        timestamp: new Date(),
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.minutesRemaining).toBe(0);
      expect(dto.hoursRemaining).toBe(0);
      expect(dto.alertLevel).toBe('critical');
    });

    it('should preserve exact timestamp', () => {
      const specificTime = new Date('2024-12-25T15:30:45.123Z');
      const data = {
        upsId: 'ups-time',
        ip: '192.168.1.50',
        minutesRemaining: 120,
        hoursRemaining: 2,
        alertLevel: 'normal' as const,
        statusLabel: 'Battery Good',
        timestamp: specificTime,
      };

      const dto = new BatteryStatusResponseDto(data);

      expect(dto.timestamp).toEqual(specificTime);
      expect(dto.timestamp.getTime()).toBe(specificTime.getTime());
    });
  });
});
