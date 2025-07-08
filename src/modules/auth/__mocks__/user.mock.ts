import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto';

export const createMockUser = (overrides?: Record<string, any>): User => {
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
    roles: [],
    isActive: true,
    ...overrides,
  });
};

export const createMockUserDto = (
  overrides?: Partial<User>,
): UserResponseDto => {
  const user = createMockUser(overrides);
  return new UserResponseDto(user);
};
