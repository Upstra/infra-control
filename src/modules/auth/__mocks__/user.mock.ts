import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockRole } from './role.mock';

export const createMockUser = (overrides?: Partial<User>): User => {
    return Object.assign(new User(), {
        id: 'user-123',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        isTwoFactorEnabled: false,
        twoFactorSecret: 'SECRET123',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: createMockRole(),
        roleId: 'role-1',
        ...overrides,
    });
};
