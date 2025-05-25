import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

export const createMockPermissionServer = (
  overrides?: Partial<PermissionServer>,
) =>
  Object.assign(new PermissionServer(), {
    roleId: 'role-uuid',
    serverId: 'server-uuid',
    allowRead: true,
    allowWrite: false,
    ...overrides,
  });

export const createMockPermissionVm = (overrides?: Partial<PermissionVm>) =>
  Object.assign(new PermissionVm(), {
    roleId: 'role-uuid',
    vmId: 'vm-uuid',
    allowRead: true,
    allowWrite: true,
    ...overrides,
  });

export const createMockPermissionServerDto = (overrides = {}) => ({
  roleId: 'role-uuid',
  serverId: 'server-uuid',
  allowRead: true,
  allowWrite: false,
  ...overrides,
});
export const createMockPermissionVmDto = (overrides = {}) => ({
  roleId: 'role-uuid',
  vmId: 'vm-uuid',
  allowRead: true,
  allowWrite: true,
  ...overrides,
});
