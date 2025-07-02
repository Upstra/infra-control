import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotRemoveGuestRoleException } from '@/modules/roles/domain/exceptions/role.exception';
import { DataSource, EntityManager } from 'typeorm';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: any;
  let roleRepo: any;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
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

    repo.findOneOrFail.mockResolvedValue(current);
    roleRepo.findOneOrFail.mockResolvedValue(newRole);

    const updated = Object.setPrototypeOf(
      { ...current, roles: [existingRole, newRole] },
      User.prototype,
    );
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(roleRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'r1' },
    });
    expect(current.roles).toEqual([existingRole, newRole]);
    expect(repo.save).toHaveBeenCalledWith(current);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should not add duplicate role', async () => {
    const existingRole = createMockRole({ id: 'r1', isAdmin: true });
    const current = createMockUser({ id: 'u1', roles: [existingRole] });
    const updated = Object.setPrototypeOf(current, User.prototype);

    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });

    repo.findOneOrFail.mockResolvedValue(current);
    roleRepo.findOneOrFail
      .mockResolvedValueOnce(existingRole)
      .mockResolvedValueOnce(guestRole);
    repo.save.mockResolvedValue(updated);

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

    repo.findOneOrFail.mockResolvedValue(current);
    repo.save.mockResolvedValue(updated);

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

    repo.findOneOrFail.mockResolvedValueOnce(current); // for user
    roleRepo.findOneOrFail
      .mockResolvedValueOnce(existingRole) // find role to remove
      .mockResolvedValueOnce(guestRole); // find guest role

    const updated = Object.setPrototypeOf(
      { ...current, roles: [guestRole] },
      User.prototype,
    );
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('u1', 'r1');

    expect(current.roles).toEqual([guestRole]);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(new UserResponseDto(updated));
  });

  it('should throw when removing last guest role', async () => {
    const guestRole = createMockRole({ id: 'g1', name: 'GUEST' });
    const current = createMockUser({ id: 'u1', roles: [guestRole] });

    repo.findOneOrFail.mockResolvedValueOnce(current); // for user
    roleRepo.findOneOrFail.mockResolvedValue(guestRole); // for role

    await expect(useCase.execute('u1', 'g1')).rejects.toThrow(
      CannotRemoveGuestRoleException,
    );
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    repo.findOneOrFail.mockResolvedValue(createMockUser({ roles: [] }));
    repo.save.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('u1', null)).rejects.toThrow('fail');
    expect(dataSource.transaction).toHaveBeenCalled();
  });
});
