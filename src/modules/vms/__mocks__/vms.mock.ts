import { Vm } from '../domain/entities/vm.entity';

export const createMockVm = (overrides?: Partial<Vm>): Vm =>
  Object.assign(new Vm(), {
    id: 'vm-1',
    name: 'VM-Test',
    server: undefined,
    serverId: undefined,
    ...overrides,
  });
