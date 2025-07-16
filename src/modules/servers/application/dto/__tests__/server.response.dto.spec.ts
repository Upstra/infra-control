import { Server } from '../../../domain/entities/server.entity';
import { ServerResponseDto } from '../server.response.dto';
import { createMockIloResponseDto } from '@/modules/ilos/__mocks__/ilo.mock';

describe('ServerResponseDto', () => {
  it('should map values from Server entity', () => {
    const server = new Server();
    server.id = 'server-id';
    server.name = 'S1';
    server.state = 'UP';
    server.ip = '192.168.0.1';
    server.type = 'esxi';
    server.priority = 1;
    server.groupId = 'group-id';
    server.roomId = 'room-id';
    server.upsId = 'ups-id';
    server.iloId = 'ilo-id';
    server.vmwareHostMoid = 'host-123';
    server.createdAt = new Date('2023-01-01T00:00:00Z');
    server.updatedAt = new Date('2023-01-02T00:00:00Z');

    const dto = new ServerResponseDto(server, createMockIloResponseDto());

    expect(dto.name).toBe(server.name);
    expect(dto.priority).toBe(server.priority);
    expect(dto.ilo).toBeDefined();
    expect(dto.iloId).toBe('ilo-id');
    expect(dto.vmwareHostMoid).toBe('host-123');
    expect(dto.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2023-01-02T00:00:00.000Z');
  });

  it('handles servers without ilo', () => {
    const server = new Server();
    server.id = 'server-id';
    server.name = 'S1';
    server.state = 'UP';
    server.ip = '192.168.0.1';
    server.type = 'esxi';
    server.priority = 1;
    server.groupId = 'group-id';
    server.roomId = 'room-id';
    server.createdAt = new Date('2023-01-01T00:00:00Z');
    server.updatedAt = new Date('2023-01-02T00:00:00Z');

    const dto = ServerResponseDto.fromEntity(server);

    expect(dto.ilo).toBeUndefined();
    expect(dto.iloId).toBeUndefined();
    expect(dto.vmwareHostMoid).toBeUndefined();
    expect(dto.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2023-01-02T00:00:00.000Z');
  });

  it('should map all VMware related fields', () => {
    const server = new Server();
    server.id = 'server-id';
    server.name = 'ESXi-Server';
    server.state = 'UP';
    server.ip = '192.168.1.10';
    server.type = 'esxi';
    server.priority = 1;
    server.groupId = 'group-id';
    server.roomId = 'room-id';
    server.upsId = 'ups-id';
    server.iloId = 'ilo-id';
    server.vmwareHostMoid = 'host-456';
    server.adminUrl = 'https://192.168.1.10';
    server.login = 'root';
    server.password = 'password';
    server.createdAt = new Date('2023-01-01T00:00:00Z');
    server.updatedAt = new Date('2023-01-02T00:00:00Z');

    const dto = new ServerResponseDto(server);

    expect(dto.id).toBe('server-id');
    expect(dto.name).toBe('ESXi-Server');
    expect(dto.state).toBe('UP');
    expect(dto.ip).toBe('192.168.1.10');
    expect(dto.type).toBe('esxi');
    expect(dto.priority).toBe(1);
    expect(dto.groupId).toBe('group-id');
    expect(dto.roomId).toBe('room-id');
    expect(dto.upsId).toBe('ups-id');
    expect(dto.iloId).toBe('ilo-id');
    expect(dto.vmwareHostMoid).toBe('host-456');
    expect(dto.adminUrl).toBe('https://192.168.1.10');
    expect(dto.login).toBe('root');
    expect(dto.password).toBe('password');
    expect(dto.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2023-01-02T00:00:00.000Z');
  });
});
