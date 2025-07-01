import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { UpdateUserFieldsUseCase } from '@/modules/users/application/use-cases';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let updateFields: jest.Mocked<UpdateUserFieldsUseCase>;

  beforeEach(() => {
    updateFields = { execute: jest.fn() } as any;
    useCase = new UpdateUserRoleUseCase(updateFields);
  });

  it('should update user role', async () => {
    const user = Object.setPrototypeOf(
      createMockUser({ id: 'u1' }),
      User.prototype,
    );
    updateFields.execute.mockResolvedValue(user);

    const result = await useCase.execute('u1', 'r1');

    expect(updateFields.execute).toHaveBeenCalledWith('u1', { roleId: 'r1' });
    expect(result).toEqual(new UserResponseDto(user));
  });

  it('should propagate errors', async () => {
    updateFields.execute.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
  });
});
