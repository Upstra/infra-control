import 'reflect-metadata';
import { validate } from 'class-validator';
import { UserResponseDto } from '../user.response.dto';
import { User } from '../../../domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('UserResponseDto', () => {
  const user = {
    id: uuidv4(),
    username: 'james',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'james@example.com',
    roleId: uuidv4(),
    active: true,
    isTwoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should map User to UserResponseDto and back', () => {
    const dto = new UserResponseDto(user as User);
    expect(dto.id).toBe(user.id);
    expect(dto.username).toBe(user.username);
    expect(dto.firstName).toBe(user.firstName);

    const entity = dto.toUser();
    expect(entity).toMatchObject(user);
  });

  it('should fail validation if email is invalid', async () => {
    const badUser = { ...user, email: 'not-an-email' };
    const dto = new UserResponseDto(badUser as User);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail if uuid is invalid', async () => {
    const badUser = { ...user, id: 'not-a-uuid' };
    const dto = new UserResponseDto(badUser as User);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
