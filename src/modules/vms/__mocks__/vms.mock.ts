import { VmCreationDto } from '../application/dto/vm.creation.dto';
import { Vm } from '../domain/entities/vm.entity';

export const createMockVm = (overrides?: Partial<Vm>): Vm =>
  Object.assign(new Vm(), {
    id: 'vm-1',
    name: 'VM-Test',
    server: undefined,
    serverId: undefined,
    ...overrides,
  });

export const createMockVmDto = (): VmCreationDto => ({
  name: 'vm-test',
  state: 'UP',
  grace_period_on: 10,
  grace_period_off: 5,
  os: 'Debian',
  adminUrl: 'http://localhost:3000',
  ip: '192.168.0.1',
  login: 'root',
  password: 'rootpass',
  priority: 1,
  serverId: 'server-uuid',
  groupId: 'group-uuid',
});
