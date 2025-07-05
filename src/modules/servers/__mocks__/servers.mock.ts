import { createMockGroup } from '@/modules/groups/__mocks__/group.mock';
import { createMockRoom } from '@/modules/rooms/__mocks__/rooms.mock';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilo.mock';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { ServerResponseDto } from '../application/dto/server.response.dto';
import { ServerCreationDto } from '../application/dto/server.creation.dto';
import { ServerUpdateDto } from '../application/dto/server.update.dto';

export const createMockServer = (overrides?: Partial<Server>): Server => {
  return Object.assign(new Server(), {
    id: 'server-1',
    name: 'Serveur Test',
    state: 'UP',
    grace_period_on: 30,
    grace_period_off: 10,
    adminUrl: 'https://admin.local',
    ip: '192.168.1.10',
    login: 'admin',
    password: 'password',
    type: 'physical',
    priority: 1,
    group: createMockGroup(),
    groupId: 'group-1',
    room: createMockRoom(),
    roomId: 'room-1',
    ups: createMockUps(),
    upsId: 'ups-1',
    vms: [createMockVm()],
    ilo: createMockIlo(),
    permissions: [],
    ...overrides,
  });
};

export const createMockServerDto = (
  overrides?: Partial<ServerResponseDto>,
): ServerResponseDto => {
  const server = createMockServer();
  return Object.assign(new ServerResponseDto(server, server.ilo), overrides);
};

export const createMockServerCreationDto = (
  overrides?: Partial<ServerCreationDto>,
): ServerCreationDto => ({
  name: 'Server1',
  state: 'UP',
  grace_period_on: 10,
  grace_period_off: 5,
  adminUrl: 'https://admin.local',
  ip: '192.168.1.1',
  login: 'admin',
  password: 'secret',
  type: 'physical',
  priority: 1,
  roomId: 'room-uuid',
  groupId: 'group-uuid',
  upsId: 'ups-uuid',
  ilo: createMockIlo(),
  ...overrides,
});

export const createMockServerUpdateDto = (
  overrides?: Partial<ServerUpdateDto>,
): ServerUpdateDto => ({
  name: 'UpdatedServer',
  state: 'DOWN',
  grace_period_on: 15,
  grace_period_off: 8,
  adminUrl: 'https://updated-admin.local',
  ip: '192.168.1.20',
  login: 'updatedAdmin',
  password: 'newSecret',
  type: 'virtual',
  priority: 2,
  roomId: 'new-room-uuid',
  groupId: 'new-group-uuid',
  upsId: 'new-ups-uuid',
  ilo: createMockIlo(),
  ...overrides,
});
