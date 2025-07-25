import {
  UserNotFoundException,
  CannotDeleteLastAdminException,
} from '@/modules/users/domain/exceptions/user.exception';
import { DeleteUserUseCase } from '../delete-user.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let mockUser = createMockUser();

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
      deleteUser: jest.fn(),
      softDeleteUser: jest.fn(),
      countAdmins: jest.fn(),
    } as any;

    useCase = new DeleteUserUseCase(repo);
  });

  it('should soft delete and anonymize user if user exists', async () => {
    const timestamp = Date.now();
    const deletedUser = createMockUser({ 
      ...mockUser, 
      deletedAt: new Date(), 
      isActive: false,
      email: `deleted_${timestamp}_${mockUser.id}@deleted.local`,
      username: `deleted_${timestamp}_${mockUser.id}`,
      firstName: 'Deleted',
      lastName: 'User'
    });
    repo.findOneByField.mockResolvedValue(mockUser);
    repo.softDeleteUser.mockResolvedValue(deletedUser);

    await expect(useCase.execute('user-id')).resolves.toBeUndefined();

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-id',
      relations: ['roles'],
    });
    expect(repo.softDeleteUser).toHaveBeenCalledWith('user-id');
  });

  it('should throw if user does not exist', async () => {
    repo.findOneByField.mockRejectedValue(new UserNotFoundException('user-id'));

    await expect(useCase.execute('user-id')).rejects.toThrow(
      UserNotFoundException,
    );

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-id',
      relations: ['roles'],
    });
    expect(repo.softDeleteUser).not.toHaveBeenCalled();
  });

  it('should throw if softDeleteUser fails', async () => {
    repo.findOneByField.mockResolvedValue(mockUser);
    repo.softDeleteUser.mockRejectedValue(new Error('DB fail'));

    await expect(useCase.execute('user-id')).rejects.toThrow('DB fail');

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-id',
      relations: ['roles'],
    });
    expect(repo.softDeleteUser).toHaveBeenCalledWith('user-id');
  });

  it('should throw if deleting the last admin', async () => {
    const adminUser = createMockUser({
      roles: [createMockRole({ isAdmin: true })],
    });
    repo.findOneByField.mockResolvedValue(adminUser);
    repo.countAdmins.mockResolvedValue(1);

    await expect(useCase.execute('user-id')).rejects.toThrow(
      CannotDeleteLastAdminException,
    );

    expect(repo.countAdmins).toHaveBeenCalled();
    expect(repo.softDeleteUser).not.toHaveBeenCalled();
  });
});
