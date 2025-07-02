import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotRemoveGuestRoleException } from '@/modules/roles/domain/exceptions/role.exception';
import { CannotRemoveLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    repo = { findOneByField: jest.fn(), save: jest.fn(), countAdmins: jest.fn() } as any;
    roleRepo = { findOneByField: jest.fn() } as any;
    useCase = new UpdateUserRoleUseCase(repo, roleRepo);
  });

  it('should add role to user', async () => {
    const existingRole = createMockRole({ id: 'r0', isAdmin: true });
    const current = createMockUser({ id: 'u1', roles: [existingRole] });
    const newRole = createMockRole({ id: 'r1', isAdmin: false });

    repo.findOneByField.mockResolvedValue(current);
    roleRepo.findOneByField.mockResolvedValue(newRole);

    const updated = Object.setPrototypeOf(
      { ...current, roles: [existingRole, newRole] },
      User.prototype,
    );
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(roleRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'r1',
    });
    expect(current.roles).toEqual([existingRole, newRole]);
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should not add duplicate role', async () => {
    const existingRole = createMockRole({ id: 'r1', isAdmin: true });
    const otherRole = createMockRole({ id: 'r2', isAdmin: false });
    const current = createMockUser({ id: 'u1', roles: [existingRole, otherRole] });
    const updated = Object.setPrototypeOf(current, User.prototype);

    repo.findOneByField.mockResolvedValue(current);
    roleRepo.findOneByField.mockResolvedValue(existingRole);
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(current.roles).toEqual([otherRole]);
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should handle null roleId without changes', async () => {
    const current = createMockUser({
      id: 'u1',
      roles: [createMockRole({ isAdmin: false })],
    });
    const updated = Object.setPrototypeOf(current, User.prototype);

    repo.findOneByField.mockResolvedValue(current);
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', null);

    expect(roleRepo.findOneByField).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should assign guest when removing last role', async () => {
    const existingRole = createMockRole({ id: 'r1', name: 'USER' });
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });
    const current = createMockUser({ id: 'u1', roles: [existingRole] });

    repo.findOneByField.mockResolvedValueOnce(current); // for user
    roleRepo.findOneByField
      .mockResolvedValueOnce(existingRole) // find role to remove
      .mockResolvedValueOnce(guestRole); // find guest role

    const updated = Object.setPrototypeOf(
      { ...current, roles: [guestRole] },
      User.prototype,
    );
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(current.roles).toEqual([guestRole]);
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should throw when removing last guest role', async () => {
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });
    const current = createMockUser({ id: 'u1', roles: [guestRole] });

    repo.findOneByField.mockResolvedValueOnce(current); // for user
    roleRepo.findOneByField.mockResolvedValue(guestRole); // for role

    await expect(useCase.execute('u1', 'g1')).rejects.toThrow(
      CannotRemoveGuestRoleException,
    );
  });

  it('should throw when removing last admin role from last admin user', async () => {
    const adminRole = createMockRole({ id: 'a1', isAdmin: true });
    const current = createMockUser({ id: 'u1', roles: [adminRole] });

    repo.findOneByField.mockResolvedValueOnce(current); // for user
    roleRepo.findOneByField.mockResolvedValue(adminRole); // for role
    repo.countAdmins.mockResolvedValue(1);

    await expect(useCase.execute('u1', 'a1')).rejects.toThrow(
      CannotRemoveLastAdminException,
    );

    expect(repo.countAdmins).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    repo.findOneByField.mockResolvedValue(createMockUser({ roles: [] }));
    repo.save.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
  });
});
