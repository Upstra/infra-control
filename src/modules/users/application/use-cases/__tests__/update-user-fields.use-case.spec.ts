import { UpdateUserFieldsUseCase } from '../update-user-fields.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import {
  UserExceptions,
  UserNotFoundException,
} from '@/modules/users/domain/exceptions/user.exception';

describe('UpdateUserFieldsUseCase', () => {
  let useCase: UpdateUserFieldsUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  const mockUser = createMockUser({ id: 'user-1', email: 'old@example.com' });

  beforeEach(() => {
    repo = {
      updateFields: jest.fn(),
      findOneByField: jest.fn(),
    } as any;

    useCase = new UpdateUserFieldsUseCase(repo);
  });

  it('should update fields and return the updated user', async () => {
    const partialUpdate: Partial<User> = { email: 'new@example.com' };
    const updatedUser = Object.setPrototypeOf(
      { ...mockUser, ...partialUpdate },
      User.prototype,
    );

    repo.updateFields.mockResolvedValue(undefined);
    repo.findOneByField.mockResolvedValue(updatedUser);

    const result = await useCase.execute(mockUser.id, partialUpdate);

    expect(repo.updateFields).toHaveBeenCalledWith(mockUser.id, partialUpdate);
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: mockUser.id,
    });
    expect(result).toEqual(updatedUser);
  });

  it('should propagate repository errors', async () => {
    repo.updateFields.mockRejectedValue(new Error('Update failed'));

    await expect(
      useCase.execute('user-1', { firstName: 'Alice' }),
    ).rejects.toThrow('Update failed');
  });

  it('should throw if user not found after update', async () => {
    repo.updateFields.mockResolvedValue(undefined);
    repo.findOneByField.mockRejectedValue(UserExceptions.notFound('user-1'));

    await expect(
      useCase.execute('user-1', { lastName: 'Doe' }),
    ).rejects.toThrow(UserNotFoundException);
  });
});
