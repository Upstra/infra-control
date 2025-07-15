import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionBit } from '../domain/value-objects/permission-bit.enum';
import { buildBitmask } from './permission-bitmask.helper';
import { Permission } from '../domain/entities/permission.entity';

export const createMockPermissionServer = (
  overrides?: Partial<PermissionServer>,
) =>
  Object.assign(new PermissionServer(), {
    roleId: 'role-uuid',
    serverId: 'server-uuid',
    bitmask: buildBitmask([PermissionBit.READ]),
    ...overrides,
  });

export const createMockPermissionServerDto = (overrides = {}) => ({
  roleId: 'role-uuid',
  serverId: 'server-uuid',
  bitmask: buildBitmask([PermissionBit.READ, PermissionBit.WRITE]),
  ...overrides,
});

export class DummyPermission extends Permission {
  serverId: string;

  constructor(bitmask: number, serverId: string) {
    super();
    this.bitmask = bitmask;
    this.serverId = serverId;
    this.roleId = 'fake-role';
  }
}
