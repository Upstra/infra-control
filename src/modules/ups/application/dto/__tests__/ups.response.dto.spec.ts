import { UpsResponseDto } from '../ups.response.dto';
import { Ups } from '../../../domain/entities/ups.entity';

describe('UpsResponseDto', () => {
  describe('constructor', () => {
    const mockUps: Ups = {
      id: 'test-id',
      name: 'Test UPS',
      ip: '192.168.1.100',
      login: 'admin',
      password: 'password',
      grace_period_on: 10,
      grace_period_off: 5,
      roomId: 'room-1',
      servers: [],
      room: null,
    } as Ups;

    it('should create a DTO with server count', () => {
      const serverCount = 5;
      const dto = new UpsResponseDto(mockUps, serverCount);

      expect(dto.id).toBe('test-id');
      expect(dto.name).toBe('Test UPS');
      expect(dto.ip).toBe('192.168.1.100');
      expect(dto.grace_period_on).toBe(10);
      expect(dto.grace_period_off).toBe(5);
      expect(dto.roomId).toBe('room-1');
      expect(dto.serverCount).toBe(5);
    });

    it('should use default server count of 0 when not provided', () => {
      const dto = new UpsResponseDto(mockUps);

      expect(dto.serverCount).toBe(0);
    });

    it('should correctly map all UPS properties', () => {
      const ups: Ups = {
        id: 'unique-id',
        name: 'UPS Name',
        ip: '10.0.0.1',
        login: 'user',
        password: 'pass',
        grace_period_on: 15,
        grace_period_off: 8,
        roomId: 'room-unique',
        servers: [],
        room: null,
      } as Ups;

      const dto = new UpsResponseDto(ups, 10);

      expect(dto.id).toBe('unique-id');
      expect(dto.name).toBe('UPS Name');
      expect(dto.ip).toBe('10.0.0.1');
      expect(dto.grace_period_on).toBe(15);
      expect(dto.grace_period_off).toBe(8);
      expect(dto.roomId).toBe('room-unique');
      expect(dto.serverCount).toBe(10);
    });

    it('should handle server count of 0', () => {
      const dto = new UpsResponseDto(mockUps, 0);

      expect(dto.serverCount).toBe(0);
    });

    it('should handle large server count', () => {
      const dto = new UpsResponseDto(mockUps, 100);

      expect(dto.serverCount).toBe(100);
    });
  });
});
