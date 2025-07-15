import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';
import { Role } from '../domain/entities/role.entity';

export const createMockRole = (overrides: Partial<Role> = {}): Role => {
  const base: Partial<Role> = {
    id: 'role-123',
    name: 'ADMIN',
    users: [],
    permissionServers: [createMockPermissionServer()],
    canCreateServer: true,
    isAdmin: true,
    ...overrides,
  };
  return Object.assign(new Role(), base);
};
