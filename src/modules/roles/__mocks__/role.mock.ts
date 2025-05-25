import {
  createMockPermissionServer,
  createMockPermissionVm,
} from '@/modules/permissions/__mocks__/permissions.mock';
import { Role } from '../domain/entities/role.entity';

export const createMockRole = (overrides: Partial<Role> = {}): Role => {
  const base: Partial<Role> = {
    id: 'role-123',
    name: 'ADMIN',
    users: [],
    permissionServers: [createMockPermissionServer()],
    permissionVms: [createMockPermissionVm()],
    canCreateServer: true,
    ...overrides,
  };
  return Object.assign(new Role(), base);
};
