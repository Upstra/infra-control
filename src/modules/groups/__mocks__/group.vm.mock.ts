import { GroupVm } from '../domain/entities/group.vm.entity';

export const createMockGroupVm = (overrides?: Partial<GroupVm>): GroupVm => {
  return Object.assign(new GroupVm(), {
    id: 'groupvm-1',
    name: 'Test VM Group',
    priority: 1,
    vms: [],
    ...overrides,
  });
};
