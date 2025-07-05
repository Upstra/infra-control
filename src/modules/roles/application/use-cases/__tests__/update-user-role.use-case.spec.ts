import { UpdateUserRoleUseCase } from '../update-user-role.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { CannotRemoveGuestRoleException } from '@/modules/roles/domain/exceptions/role.exception';
import { DataSource, EntityManager } from 'typeorm';
import { CannotRemoveLastAdminException } from '@/modules/users/domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: any;
  let roleRepo: any;
  let dataSource: jest.Mocked<DataSource>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

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
    logHistory = {
      execute: jest.fn(),
      executeStructured: jest.fn(),
    } as any;
    useCase = new UpdateUserRoleUseCase(dataSource, logHistory);
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

  describe('Structured Logging', () => {
    const requestContext = RequestContextDto.forTesting({
      ipAddress: '172.16.0.1',
      userAgent: 'Test-Browser/1.0',
    });

    it('should log role addition with structured data', async () => {
      const existingRole = createMockRole({
        id: 'r0',
        name: 'USER',
        isAdmin: false,
      });
      const current = createMockUser({ id: 'u1', roles: [existingRole] });
      const newRole = createMockRole({
        id: 'r1',
        name: 'ADMIN',
        isAdmin: true,
      });

      repo.findOneOrFail.mockResolvedValueOnce(current);
      roleRepo.findOneOrFail.mockResolvedValueOnce(newRole);

      const updated = Object.setPrototypeOf(
        { ...current, roles: [existingRole, newRole] },
        User.prototype,
      );
      repo.save.mockResolvedValueOnce(updated);

      await useCase.execute('u1', 'r1', 'admin-user', requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'user_role',
        entityId: 'u1',
        action: 'UPDATE_ROLE',
        userId: 'admin-user',
        oldValue: {
          roles: [{ id: 'r0', name: 'USER', isAdmin: false }],
        },
        newValue: {
          roles: [
            { id: 'r0', name: 'USER', isAdmin: false },
            { id: 'r1', name: 'ADMIN', isAdmin: true },
          ],
        },
        metadata: {
          operationType: 'ADD_ROLE',
          targetRoleName: 'ADMIN',
          targetRoleIsAdmin: true,
          previousRoleCount: 1,
          newRoleCount: 2,
          isElevationToAdmin: true,
          isRemovalFromAdmin: false,
        },
        ipAddress: '172.16.0.1',
        userAgent: 'Test-Browser/1.0',
      });
    });

    it('should log role removal with structured data', async () => {
      const adminRole = createMockRole({
        id: 'r1',
        name: 'ADMIN',
        isAdmin: true,
      });
      const userRole = createMockRole({
        id: 'r2',
        name: 'USER',
        isAdmin: false,
      });
      const current = createMockUser({
        id: 'u1',
        roles: [adminRole, userRole],
      });

      repo.findOneOrFail.mockResolvedValueOnce(current);
      roleRepo.findOneOrFail.mockResolvedValueOnce(adminRole);

      const updated = Object.setPrototypeOf(
        { ...current, roles: [userRole] },
        User.prototype,
      );
      repo.save.mockResolvedValueOnce(updated);

      await useCase.execute('u1', 'r1', 'admin-user', requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'user_role',
        entityId: 'u1',
        action: 'UPDATE_ROLE',
        userId: 'admin-user',
        oldValue: {
          roles: [
            { id: 'r1', name: 'ADMIN', isAdmin: true },
            { id: 'r2', name: 'USER', isAdmin: false },
          ],
        },
        newValue: {
          roles: [{ id: 'r2', name: 'USER', isAdmin: false }],
        },
        metadata: {
          operationType: 'REMOVE_ROLE',
          targetRoleName: 'ADMIN',
          targetRoleIsAdmin: true,
          previousRoleCount: 2,
          newRoleCount: 1,
          isElevationToAdmin: false,
          isRemovalFromAdmin: true,
        },
        ipAddress: '172.16.0.1',
        userAgent: 'Test-Browser/1.0',
      });
    });

    it('should log guest role assignment with structured data', async () => {
      const userRole = createMockRole({
        id: 'r1',
        name: 'USER',
        isAdmin: false,
      });
      const guestRole = createMockRole({
        id: 'g1',
        name: 'GUEST',
        isAdmin: false,
      });
      const current = createMockUser({ id: 'u1', roles: [userRole] });

      repo.findOneOrFail.mockResolvedValueOnce(current);
      roleRepo.findOneOrFail
        .mockResolvedValueOnce(userRole)
        .mockResolvedValueOnce(guestRole);

      const updated = Object.setPrototypeOf(
        { ...current, roles: [guestRole] },
        User.prototype,
      );
      repo.save.mockResolvedValueOnce(updated);

      await useCase.execute('u1', 'r1', 'admin-user', requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'user_role',
        entityId: 'u1',
        action: 'UPDATE_ROLE',
        userId: 'admin-user',
        oldValue: {
          roles: [{ id: 'r1', name: 'USER', isAdmin: false }],
        },
        newValue: {
          roles: [{ id: 'g1', name: 'GUEST', isAdmin: false }],
        },
        metadata: {
          operationType: 'ASSIGN_GUEST',
          targetRoleName: 'GUEST',
          targetRoleIsAdmin: false,
          previousRoleCount: 1,
          newRoleCount: 1,
          isElevationToAdmin: false,
          isRemovalFromAdmin: false,
        },
        ipAddress: '172.16.0.1',
        userAgent: 'Test-Browser/1.0',
      });
    });

    it('should work without request context', async () => {
      const existingRole = createMockRole({ id: 'r0', isAdmin: true });
      const current = createMockUser({ id: 'u1', roles: [existingRole] });

      repo.findOneOrFail.mockResolvedValueOnce(current);
      const updated = Object.setPrototypeOf(current, User.prototype);
      repo.save.mockResolvedValueOnce(updated);

      await useCase.execute('u1', null, 'admin-user');

      expect(logHistory.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });
  });
});
