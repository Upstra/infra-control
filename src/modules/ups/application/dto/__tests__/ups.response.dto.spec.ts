import { UpsResponseDto } from '../ups.response.dto';
import { Ups } from '../../../domain/entities/ups.entity';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('UpsResponseDto', () => {
  describe('constructor', () => {
    const mockUps: Ups = {
      id: 'test-id',
      name: 'Test UPS',
      ip: '192.168.1.100',
      grace_period_on: 30,
      grace_period_off: 60,
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
      expect(dto.grace_period_on).toBe(30);
      expect(dto.grace_period_off).toBe(60);
      expect(dto.roomId).toBe('room-1');
      expect(dto.serverCount).toBe(5);
      expect(dto.servers).toEqual([]);
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
        grace_period_on: 45,
        grace_period_off: 90,
        roomId: 'room-unique',
        servers: [],
        room: null,
      } as Ups;

      const dto = new UpsResponseDto(ups, 10);

      expect(dto.id).toBe('unique-id');
      expect(dto.name).toBe('UPS Name');
      expect(dto.ip).toBe('10.0.0.1');
      expect(dto.grace_period_on).toBe(45);
      expect(dto.grace_period_off).toBe(90);
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

    it('should correctly map servers when provided', () => {
      const mockServers: Server[] = [
        {
          id: 'server-1',
          name: 'Web Server 01',
          ip: '192.168.1.10',
          state: 'UP',
          type: 'vcenter',
        } as Server,
        {
          id: 'server-2',
          name: 'Database Server',
          ip: '192.168.1.11',
          state: 'DOWN',
          type: 'esxi',
        } as Server,
      ];

      const upsWithServers = {
        ...mockUps,
        servers: mockServers,
      } as Ups;

      const dto = new UpsResponseDto(upsWithServers, 2);

      expect(dto.servers).toHaveLength(2);
      expect(dto.servers[0]).toEqual({
        id: 'server-1',
        name: 'Web Server 01',
        ip: '192.168.1.10',
        state: 'UP',
        type: 'vcenter',
      });
      expect(dto.servers[1]).toEqual({
        id: 'server-2',
        name: 'Database Server',
        ip: '192.168.1.11',
        state: 'DOWN',
        type: 'esxi',
      });
      expect(dto.serverCount).toBe(2);
    });

    it('should handle UPS without servers property', () => {
      const upsWithoutServers = {
        ...mockUps,
        servers: undefined,
      } as any;

      const dto = new UpsResponseDto(upsWithoutServers, 0);

      expect(dto.servers).toBeUndefined();
      expect(dto.serverCount).toBe(0);
    });
  });
});
