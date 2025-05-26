import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { createMockRoom } from '@/modules/rooms/__mocks__/rooms.mock';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilos.mock';
import { Server } from '@/modules/servers/domain/entities/server.entity';

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
    group: createMockGroupServer(),
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
