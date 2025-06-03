import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionVmDto } from '../application/dto/permission.vm.dto';
import { PermissionBit } from '../domain/value-objects/permission-bit.enum';
import { buildBitmask } from './permission-bitmask.helper';

export const createMockPermissionServer = (
  overrides?: Partial<PermissionServer>,
) =>
  Object.assign(new PermissionServer(), {
    roleId: 'role-uuid',
    serverId: 'server-uuid',
    bitmask: buildBitmask([PermissionBit.READ]),
    ...overrides,
  });

export const createMockPermissionVm = (overrides?: Partial<PermissionVm>) =>
  Object.assign(new PermissionVm(), {
    roleId: 'role-uuid',
    vmId: 'vm-uuid',
    bitmask: buildBitmask([PermissionBit.READ]),
    ...overrides,
  });

export const createMockPermissionServerDto = (overrides = {}) => ({
  roleId: 'role-uuid',
  serverId: 'server-uuid',
  bitmask: buildBitmask([PermissionBit.READ, PermissionBit.WRITE]),
  ...overrides,
});

export const createMockPermissionVmDto = (
  overrides?: Partial<PermissionVmDto>,
) => {
  const base: PermissionVmDto = {
    roleId: 'c9e9f5ae-9fd6-4c28-b88d-838f4c5c27fd',
    vmId: 'a2b7b46f-8f3c-4f12-87bb-9b1bb8db1a44',
    bitmask: buildBitmask([PermissionBit.WRITE]),
    ...overrides,
  };

  return Object.fromEntries(
    Object.entries(base).filter(([_, v]) => v !== undefined),
  ) as PermissionVmDto;
};
