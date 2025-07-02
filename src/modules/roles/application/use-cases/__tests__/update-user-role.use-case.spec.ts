import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotRemoveGuestRoleException } from '@/modules/roles/domain/exceptions/role.exception';
import { DataSource, EntityManager } from 'typeorm';
import { CannotRemoveLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: any;
  let roleRepo: any;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    repo = {
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };
    roleRepo = {
      findOneOrFail: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(
        async (cb: (manager: Partial<EntityManager>) => any) =>
          cb({
            getRepository: (entity: unknown) =>
              (entity === User ? repo : roleRepo) as any,
          }),
      ),
    } as any;
    useCase = new UpdateUserRoleUseCase(dataSource);
  });

  it('should add role to user', async () => {
    const existingRole = createMockRole({ id: 'r0', isAdmin: true });
    const current = createMockUser({ id: 'u1', roles: [existingRole] });
    const newRole = createMockRole({ id: 'r1', isAdmin: false });

    repo.findOneOrFail.mockResolvedValueOnce(current); // user
    roleRepo.findOneOrFail.mockResolvedValueOnce(newRole); // role

    const updated = Object.setPrototypeOf(
      { ...current, roles: [existingRole, newRole] },
      User.prototype,
    );
    repo.save.mockResolvedValueOnce(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(roleRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'r1' },
    });
    expect(current.roles.map((r) => r.id)).toEqual([
      existingRole.id,
      newRole.id,
    ]);
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should not add duplicate role and remove role, assign GUEST if no roles left', async () => {
    const existingRole = createMockRole({ id: 'r1', isAdmin: true });
    const current = createMockUser({
      id: 'u1',
      roles: [existingRole],
    });
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });

    repo.findOneOrFail.mockResolvedValueOnce(current); // user
    roleRepo.findOneOrFail
      .mockResolvedValueOnce(existingRole) // find role to remove
      .mockResolvedValueOnce(guestRole); // assign guest

    const updated = Object.setPrototypeOf(
      { ...current, roles: [guestRole] },
      User.prototype,
    );
    repo.save.mockResolvedValueOnce(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(current.roles).toEqual([guestRole]);
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should handle null roleId without changes', async () => {
    const current = createMockUser({
      id: 'u1',
      roles: [createMockRole({ isAdmin: false })],
    });
    const updated = Object.setPrototypeOf(current, User.prototype);

    repo.findOneOrFail.mockResolvedValueOnce(current);
    repo.save.mockResolvedValueOnce(updated);

    const result = await useCase.execute('u1', null);

    expect(roleRepo.findOneOrFail).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should assign guest when removing last role', async () => {
    const existingRole = createMockRole({ id: 'r1', name: 'USER' });
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });
    const current = createMockUser({ id: 'u1', roles: [existingRole] });

    repo.findOneOrFail.mockResolvedValueOnce(current); // user
    roleRepo.findOneOrFail
      .mockResolvedValueOnce(existingRole) // find role to remove
      .mockResolvedValueOnce(guestRole); // assign guest

    const updated = Object.setPrototypeOf(
      { ...current, roles: [guestRole] },
      User.prototype,
    );
    repo.save.mockResolvedValueOnce(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(current.roles).toEqual([guestRole]);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should throw when removing last guest role', async () => {
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });
    const current = createMockUser({ id: 'u1', roles: [guestRole] });

    repo.findOneOrFail.mockResolvedValueOnce(current); // user
    roleRepo.findOneOrFail.mockResolvedValueOnce(guestRole); // role

    await expect(useCase.execute('u1', 'g1')).rejects.toThrow(
      CannotRemoveGuestRoleException,
    );
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('should throw when removing last admin role from last admin user', async () => {
    const adminRole = createMockRole({ id: 'a1', isAdmin: true });
    const current = createMockUser({ id: 'u1', roles: [adminRole] });

    repo.findOneOrFail.mockResolvedValueOnce(current); // user
    roleRepo.findOneOrFail.mockResolvedValueOnce(adminRole); // role
    repo.count.mockResolvedValueOnce(1); // only 1 admin in system

    await expect(useCase.execute('u1', 'a1')).rejects.toThrow(
      CannotRemoveLastAdminException,
    );
    expect(repo.count).toHaveBeenCalledWith({
      where: { roles: { isAdmin: true } },
    });
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    repo.findOneOrFail.mockResolvedValueOnce(createMockUser({ roles: [] }));
    repo.save.mockRejectedValueOnce(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('should assign GUEST if user starts with no roles and removes one', async () => {
    const emptyUser = createMockUser({ id: 'u1', roles: [] });
    const toRemoveRole = createMockRole({ id: 'r1', name: 'USER' });
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });

    repo.findOneOrFail.mockResolvedValueOnce(emptyUser); // user
    roleRepo.findOneOrFail
      .mockResolvedValueOnce(toRemoveRole)
      .mockResolvedValueOnce(guestRole);
    const updated = Object.setPrototypeOf(
      { ...emptyUser, roles: [guestRole] },
      User.prototype,
    );
    repo.save.mockResolvedValueOnce(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(emptyUser.roles).toEqual([guestRole]);
    expect(result).toEqual(new UserResponseDto(updated));
  });
});
