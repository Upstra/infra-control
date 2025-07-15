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

    const dto = new ServerResponseDto(server, createMockIloResponseDto());

    expect(dto.name).toBe(server.name);
    expect(dto.priority).toBe(server.priority);
    expect(dto.ilo).toBeDefined();
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

    const dto = ServerResponseDto.fromEntity(server);

    expect(dto.ilo).toBeUndefined();
  });
});
