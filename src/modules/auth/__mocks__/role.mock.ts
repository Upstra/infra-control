import { Role } from '@/modules/roles/domain/entities/role.entity';

export const createMockRole = (overrides?: Partial<Role>): Role => {
    return Object.assign(new Role(), {
        id: 'role-1',
        name: 'user',
        canCreateServer: false,
        users: [],
        permissionServers: [],
        permissionVms: [],
        ...overrides,
    });
};
