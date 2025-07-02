import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotDeleteLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    repo = { findOneByField: jest.fn(), countAdmins: jest.fn(), save: jest.fn() } as any;
    roleRepo = { findOneByField: jest.fn() } as any;
    useCase = new UpdateUserRoleUseCase(repo, roleRepo);
  });

  it('should update user role', async () => {
    const current = createMockUser({ id: 'u1', roles: [createMockRole({ isAdmin: true })] });
    repo.findOneByField.mockResolvedValue(current);
    repo.countAdmins.mockResolvedValue(2);
    const updated = Object.setPrototypeOf(current, User.prototype);
    roleRepo.findOneByField.mockResolvedValue(createMockRole({ isAdmin: false }));
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(roleRepo.findOneByField).toHaveBeenCalledWith({ field: 'id', value: 'r1' });
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should propagate errors', async () => {
    repo.findOneByField.mockResolvedValue(createMockUser({ roles: [createMockRole({ isAdmin: false })] }));
    repo.countAdmins.mockResolvedValue(2);
    repo.save.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
  });

  it('should throw if demoting the last admin', async () => {
    const adminUser = createMockUser({ roles: [createMockRole({ isAdmin: true })] });
    repo.findOneByField.mockResolvedValue(adminUser);
    repo.countAdmins.mockResolvedValue(1);
    roleRepo.findOneByField.mockResolvedValue(createMockRole({ isAdmin: false }));

    await expect(useCase.execute('u1', 'r2')).rejects.toThrow(
      CannotDeleteLastAdminException,
    );

    expect(repo.save).not.toHaveBeenCalled();
  });
});
