import { DataSource } from 'typeorm';
import { UpdateUserRolesUseCase } from '../update-user-roles.use-case';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '../../../domain/entities/role.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { UserExceptions } from '@/modules/users/domain/exceptions/user.exception';
import { RoleExceptions } from '../../../domain/exceptions/role.exception';

describe('UpdateUserRolesUseCase', () => {
  let useCase: UpdateUserRolesUseCase;
  let dataSource: jest.Mocked<DataSource>;
  let manager: any;
  let userRepo: any;
  let roleRepo: any;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

  beforeEach(() => {
    userRepo = {
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    roleRepo = {
      findOneOrFail: jest.fn(),
      findByIds: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return userRepo;
        if (entity === Role) return roleRepo;
      }),
    };

    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
    } as any;

    logHistory = {
      executeStructured: jest.fn(),
    } as any;

    useCase = new UpdateUserRolesUseCase(dataSource, logHistory);
  });

  describe('Single role toggle', () => {
    it('should add a role when user does not have it', async () => {
      const userId = 'user-id';
      const roleId = 'role-id';
      const currentUserId = 'current-user-id';

      const existingRole = {
        id: 'existing-role-id',
        name: 'USER',
        isAdmin: false,
      };
      const newRole = { id: roleId, name: 'ADMIN', isAdmin: true };
      const user = {
        id: userId,
        roles: [existingRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(newRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [existingRole, newRole],
      });

      await useCase.execute(userId, roleId, undefined, currentUserId);

      expect(userRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['roles'],
      });
      expect(roleRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(userRepo.save).toHaveBeenCalledWith({
        ...user,
        roles: [existingRole, newRole],
      });
      expect(logHistory.executeStructured).toHaveBeenCalled();
    });

    it('should remove a role when user has it', async () => {
      const userId = 'user-id';
      const roleId = 'role-id';
      const currentUserId = 'current-user-id';

      const roleToRemove = { id: roleId, name: 'USER', isAdmin: false };
      const remainingRole = {
        id: 'remaining-role-id',
        name: 'GUEST',
        isAdmin: false,
      };
      const user = {
        id: userId,
        roles: [roleToRemove, remainingRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(roleToRemove);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [remainingRole],
      });

      await useCase.execute(userId, roleId, undefined, currentUserId);

      expect(user.roles).toEqual([remainingRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('should throw error when trying to remove last admin role', async () => {
      const userId = 'user-id';
      const roleId = 'admin-role-id';

      const adminRole = { id: roleId, name: 'ADMIN', isAdmin: true };
      const user = {
        id: userId,
        roles: [adminRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(adminRole);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      userRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(useCase.execute(userId, roleId, undefined)).rejects.toThrow(
        UserExceptions.cannotRemoveLastAdminRole(),
      );
    });

    it('should allow removing admin role when there are other admins', async () => {
      const userId = 'user-id';
      const roleId = 'admin-role-id';

      const adminRole = { id: roleId, name: 'ADMIN', isAdmin: true };
      const guestRole = { id: 'guest-id', name: 'GUEST', isAdmin: false };
      const user = {
        id: userId,
        roles: [adminRole, guestRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(adminRole);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3), // 3 admins total
      };
      userRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [guestRole],
      });

      await useCase.execute(userId, roleId, undefined);

      expect(user.roles).toEqual([guestRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('should throw error when trying to remove last guest role', async () => {
      const userId = 'user-id';
      const roleId = 'guest-id';

      const guestRole = { id: roleId, name: 'GUEST', isAdmin: false };
      const user = {
        id: userId,
        roles: [guestRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(guestRole);

      await expect(useCase.execute(userId, roleId, undefined)).rejects.toThrow(
        RoleExceptions.cannotRemoveGuestRole(),
      );
    });

    it('should allow removing guest role when user has other roles', async () => {
      const userId = 'user-id';
      const roleId = 'guest-id';

      const guestRole = { id: roleId, name: 'GUEST', isAdmin: false };
      const userRole = { id: 'user-role', name: 'USER', isAdmin: false };
      const user = {
        id: userId,
        roles: [guestRole, userRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(guestRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [userRole],
      });

      await useCase.execute(userId, roleId, undefined);

      expect(user.roles).toEqual([userRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('should handle user with multiple admin roles', async () => {
      const userId = 'user-id';
      const roleId = 'admin1-id';

      const adminRole1 = { id: roleId, name: 'ADMIN', isAdmin: true };
      const adminRole2 = {
        id: 'admin2-id',
        name: 'SUPER_ADMIN',
        isAdmin: true,
      };
      const userRole = { id: 'user-role', name: 'USER', isAdmin: false };
      const user = {
        id: userId,
        roles: [adminRole1, adminRole2, userRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(adminRole1);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [adminRole2, userRole],
      });

      await useCase.execute(userId, roleId, undefined);

      expect(user.roles).toEqual([adminRole2, userRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      // Should not check admin count because user has multiple admin roles
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should assign guest role when user has no roles', async () => {
      const userId = 'user-id';
      const guestRole = { id: 'guest-id', name: 'GUEST', isAdmin: false };
      const user = {
        id: userId,
        roles: [],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(guestRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [guestRole],
      });

      await useCase.execute(userId, null, undefined);

      expect(roleRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { name: 'GUEST' },
      });
      expect(user.roles).toEqual([guestRole]);
    });
  });

  describe('Multiple roles assignment', () => {
    it('should replace all roles with new roles', async () => {
      const userId = 'user-id';
      const roleIds = ['role1', 'role2'];
      const currentUserId = 'current-user-id';

      const oldRole = { id: 'old-role', name: 'OLD', isAdmin: false };
      const newRoles = [
        { id: 'role1', name: 'USER', isAdmin: false },
        { id: 'role2', name: 'EDITOR', isAdmin: false },
      ];
      const user = {
        id: userId,
        roles: [oldRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findByIds.mockResolvedValue(newRoles);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: newRoles,
      });

      await useCase.execute(userId, undefined, roleIds, currentUserId);

      expect(roleRepo.findByIds).toHaveBeenCalledWith(roleIds);
      expect(user.roles).toEqual(newRoles);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('should throw error when some roles are not found', async () => {
      const userId = 'user-id';
      const roleIds = ['role1', 'role2', 'invalid-role'];

      const user = {
        id: userId,
        roles: [],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findByIds.mockResolvedValue([
        { id: 'role1', name: 'USER' },
        { id: 'role2', name: 'EDITOR' },
      ]);

      await expect(useCase.execute(userId, undefined, roleIds)).rejects.toThrow(
        RoleExceptions.roleNotFound(),
      );
    });

    it('should assign guest role when empty array is provided', async () => {
      const userId = 'user-id';
      const guestRole = { id: 'guest-id', name: 'GUEST', isAdmin: false };
      const user = {
        id: userId,
        roles: [{ id: 'some-role', name: 'USER' }],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(guestRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [guestRole],
      });

      await useCase.execute(userId, undefined, []);

      expect(user.roles).toEqual([guestRole]);
    });

    it('should throw error when trying to remove last admin via multiple roles', async () => {
      const userId = 'user-id';
      const roleIds = ['regular-role'];

      const adminRole = { id: 'admin-role', name: 'ADMIN', isAdmin: true };
      const regularRole = { id: 'regular-role', name: 'USER', isAdmin: false };
      const user = {
        id: userId,
        roles: [adminRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findByIds.mockResolvedValue([regularRole]);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      // Ensure manager.getRepository returns the right repository for each entity
      manager.getRepository.mockImplementation((entity) => {
        if (entity === User) {
          return {
            ...userRepo,
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          };
        }
        if (entity === Role) return roleRepo;
      });

      await expect(useCase.execute(userId, undefined, roleIds)).rejects.toThrow(
        UserExceptions.cannotRemoveLastAdminRole(),
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error when both roleId and roleIds are provided', async () => {
      await expect(
        useCase.execute('user-id', 'role-id', ['role1', 'role2']),
      ).rejects.toThrow(RoleExceptions.cannotSpecifyBothRoleIdAndRoleIds());
    });
  });

  describe('Logging', () => {
    it('should log role changes with metadata', async () => {
      const userId = 'user-id';
      const roleId = 'role-id';
      const currentUserId = 'current-user-id';
      const requestContext = {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      const existingRole = {
        id: 'existing-role-id',
        name: 'USER',
        isAdmin: false,
      };
      const newRole = { id: roleId, name: 'ADMIN', isAdmin: true };
      const user = {
        id: userId,
        roles: [existingRole],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(newRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [existingRole, newRole],
      });

      await useCase.execute(
        userId,
        roleId,
        undefined,
        currentUserId,
        requestContext,
      );

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'user_role',
        entityId: userId,
        action: 'UPDATE_ROLE',
        userId: currentUserId,
        oldValue: {
          roles: [
            {
              id: existingRole.id,
              name: existingRole.name,
              isAdmin: existingRole.isAdmin,
            },
          ],
        },
        newValue: {
          roles: [
            {
              id: existingRole.id,
              name: existingRole.name,
              isAdmin: existingRole.isAdmin,
            },
            {
              id: newRole.id,
              name: newRole.name,
              isAdmin: newRole.isAdmin,
            },
          ],
        },
        metadata: {
          operationType: 'ADD_ROLE',
          previousRoleCount: 1,
          newRoleCount: 2,
          isElevationToAdmin: true,
          isRemovalFromAdmin: false,
        },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });
    });
  });

  describe('Without logHistory', () => {
    it('should work without logHistory service', async () => {
      const useCaseWithoutHistory = new UpdateUserRolesUseCase(dataSource);

      const userId = 'user-id';
      const roleId = 'role-id';
      const newRole = { id: roleId, name: 'USER', isAdmin: false };
      const user = {
        id: userId,
        roles: [],
      };

      userRepo.findOneOrFail.mockResolvedValue(user);
      roleRepo.findOneOrFail.mockResolvedValue(newRole);
      userRepo.save.mockResolvedValue({
        ...user,
        roles: [newRole],
      });

      await useCaseWithoutHistory.execute(userId, roleId, undefined);
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
