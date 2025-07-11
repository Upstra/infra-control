import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RoleDto } from '@/modules/roles/application/dto/role.dto';

export const createMockJwtPayload = (overrides?: Partial<JwtPayload>): JwtPayload => {
  const mockRole: RoleDto = {
    id: 'role-1',
    name: 'user',
    permissionVms: [],
    permissionServers: [],
    canCreateServer: false,
    isAdmin: false,
  };

  return {
    userId: 'user-123',
    email: 'user@example.com',
    isTwoFactorEnabled: false,
    role: mockRole,
    isActive: true,
    ...overrides,
  };
};