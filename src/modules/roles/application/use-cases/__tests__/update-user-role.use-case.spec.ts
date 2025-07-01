import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { UpdateUserFieldsUseCase } from '@/modules/users/application/use-cases';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotDeleteLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let updateFields: jest.Mocked<UpdateUserFieldsUseCase>;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    updateFields = { execute: jest.fn() } as any;
    repo = { findOneByField: jest.fn(), countAdmins: jest.fn() } as any;
    roleRepo = { findOneByField: jest.fn() } as any;
    useCase = new UpdateUserRoleUseCase(updateFields, repo, roleRepo);
  });

  it('should update user role', async () => {
    const current = createMockUser({ id: 'u1', role: createMockRole({ isAdmin: true }) });
    repo.findOneByField.mockResolvedValue(current);
    repo.countAdmins.mockResolvedValue(2);
    const updated = Object.setPrototypeOf(current, User.prototype);
    updateFields.execute.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(updateFields.execute).toHaveBeenCalledWith('u1', { roleId: 'r1' });
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should propagate errors', async () => {
    repo.findOneByField.mockResolvedValue(createMockUser({ role: createMockRole({ isAdmin: false }) }));
    repo.countAdmins.mockResolvedValue(2);
    updateFields.execute.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
  });

  it('should throw if demoting the last admin', async () => {
    const adminUser = createMockUser({ role: createMockRole({ isAdmin: true }) });
    repo.findOneByField.mockResolvedValue(adminUser);
    repo.countAdmins.mockResolvedValue(1);
    roleRepo.findOneByField.mockResolvedValue(createMockRole({ isAdmin: false }));

    await expect(useCase.execute('u1', 'r2')).rejects.toThrow(
      CannotDeleteLastAdminException,
    );

    expect(updateFields.execute).not.toHaveBeenCalled();
  });
});
