import 'reflect-metadata';
import { validate } from 'class-validator';
import { UserResponseDto } from '../user.response.dto';
import { User } from '../../../domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('UserResponseDto', () => {
  const createMockUser = (overrides?: Partial<User>): User => {
    return {
      id: uuidv4(),
      username: 'james',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'james@example.com',
      password: 'hashed',
      twoFactorSecret: null,
      roles: [],
      isActive: true,
      isVerified: true,
      isTwoFactorEnabled: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as User;
  };

  it('should map User to UserResponseDto and back', () => {
    const user = createMockUser();
    const dto = new UserResponseDto(user);
    expect(dto.id).toBe(user.id);
    expect(dto.username).toBe(user.username);
    expect(dto.firstName).toBe(user.firstName);

    const entity = dto.toUser();
    expect(entity.id).toBe(user.id);
    expect(entity.username).toBe(user.username);
    expect(entity.firstName).toBe(user.firstName);
    expect(entity.lastName).toBe(user.lastName);
    expect(entity.email).toBe(user.email);
    expect(entity.isActive).toBe(user.isActive);
    expect(entity.isVerified).toBe(user.isVerified);
    expect(entity.isTwoFactorEnabled).toBe(user.isTwoFactorEnabled);
  });

  it('should fail validation if email is invalid', async () => {
    const user = createMockUser({ email: 'not-an-email' });
    const dto = new UserResponseDto(user);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail if uuid is invalid', async () => {
    const user = createMockUser({ id: 'not-a-uuid' });
    const dto = new UserResponseDto(user);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
