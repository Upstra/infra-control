import { VmCreationDto } from '../application/dto/vm.creation.dto';
import { Vm } from '../domain/entities/vm.entity';
import { VmResponseDto } from '../application/dto/vm.response.dto';

export const createMockVm = (overrides?: Partial<Vm>): Vm =>
  Object.assign(new Vm(), {
    id: 'vm-1',
    name: 'VM-Test',
    state: 'RUNNING',
    grace_period_on: 30,
    grace_period_off: 10,
    os: 'Ubuntu 22.04',
    adminUrl: 'https://admin.local',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
    priority: 1,
    serverId: 'server-1',
    groupId: 'group-vm-1',
    server: undefined,
    ...overrides,
  });

export const createMockVmResponseDto = (
  overrides?: Partial<Vm>,
): VmResponseDto => {
  const vm = createMockVm(overrides);
  return new VmResponseDto(vm);
};

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
