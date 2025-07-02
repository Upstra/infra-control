import { SafeRoleDeletionDomainService } from '../safe-role-deletion.domain.service';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../interfaces/role.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import {
  CannotDeleteSystemRoleException,
  CannotDeleteLastAdminRoleException,
} from '../../exceptions/role.exception';

describe('SafeRoleDeletionDomainService', () => {
  let service: SafeRoleDeletionDomainService;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    userRepo = {
      findUsersByRole: jest.fn(),
      save: jest.fn(),
      findOneByField: jest.fn(),
    } as any;

    roleRepo = {
      findOneByField: jest.fn(),
      createRole: jest.fn(),
      save: jest.fn(),
      deleteRole: jest.fn(),
      countAdminRoles: jest.fn(),
    } as any;

    service = new SafeRoleDeletionDomainService(userRepo, roleRepo);
  });

  describe('safelyDeleteRole', () => {
    it('should delete role when no users have it', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({
        id: roleId,
        name: 'DEVELOPER',
        isAdmin: false,
      });

      roleRepo.findOneByField.mockResolvedValue(roleToDelete);
      userRepo.findUsersByRole.mockResolvedValue([]);

      await service.safelyDeleteRole(roleId);

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: roleId,
      });
      expect(userRepo.findUsersByRole).toHaveBeenCalledWith(roleId);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should reassign users with only deleted role to Guest role', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({
        id: roleId,
        name: 'DEVELOPER',
        isAdmin: false,
      });
      const guestRole = createMockRole({ id: 'guest-id', name: 'GUEST' });

      const user1 = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete],
      });
      const user2 = createMockUser({
        id: 'user2',
        username: 'user2',
        roles: [roleToDelete],
      });

      roleRepo.findOneByField.mockResolvedValueOnce(roleToDelete);
      roleRepo.findOneByField.mockResolvedValueOnce(guestRole);
      userRepo.findUsersByRole.mockResolvedValue([user1, user2]);

      await service.safelyDeleteRole(roleId);

      expect(user1.roles).toEqual([guestRole]);
      expect(user2.roles).toEqual([guestRole]);
      expect(userRepo.save).toHaveBeenCalledTimes(2);
      expect(userRepo.save).toHaveBeenCalledWith(user1);
      expect(userRepo.save).toHaveBeenCalledWith(user2);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should remove role but keep other roles for users with multiple roles', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({
        id: roleId,
        name: 'DEVELOPER',
        isAdmin: false,
      });
      const adminRole = createMockRole({ id: 'admin-id', name: 'SUPER_ADMIN' });

      const user = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete, adminRole],
      });

      roleRepo.findOneByField.mockResolvedValue(roleToDelete);
      userRepo.findUsersByRole.mockResolvedValue([user]);

      await service.safelyDeleteRole(roleId);

      expect(user.roles).toEqual([adminRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should create Guest role if it does not exist', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({
        id: roleId,
        name: 'DEVELOPER',
        isAdmin: false,
      });
      const guestRole = createMockRole({ id: 'guest-id', name: 'GUEST' });

      const user = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete],
      });

      roleRepo.findOneByField.mockResolvedValueOnce(roleToDelete);
      roleRepo.findOneByField.mockResolvedValueOnce(null);
      userRepo.findUsersByRole.mockResolvedValue([user]);
      roleRepo.createRole.mockResolvedValue(guestRole);

      await service.safelyDeleteRole(roleId);

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'name',
        value: 'GUEST',
      });
      expect(roleRepo.createRole).toHaveBeenCalledWith('GUEST');
      expect(user.roles).toEqual([guestRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should handle mixed scenario with users having different role combinations', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({
        id: roleId,
        name: 'DEVELOPER',
        isAdmin: false,
      });
      const adminRole = createMockRole({ id: 'admin-id', name: 'SUPER_ADMIN' });
      const guestRole = createMockRole({ id: 'guest-id', name: 'GUEST' });

      const userWithOnlyDeletedRole = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete],
      });

      const userWithMultipleRoles = createMockUser({
        id: 'user2',
        username: 'user2',
        roles: [roleToDelete, adminRole],
      });

      roleRepo.findOneByField.mockResolvedValueOnce(roleToDelete);
      roleRepo.findOneByField.mockResolvedValueOnce(guestRole);
      userRepo.findUsersByRole.mockResolvedValue([
        userWithOnlyDeletedRole,
        userWithMultipleRoles,
      ]);

      await service.safelyDeleteRole(roleId);

      expect(userWithOnlyDeletedRole.roles).toEqual([guestRole]);
      expect(userWithMultipleRoles.roles).toEqual([adminRole]);
      expect(userRepo.save).toHaveBeenCalledTimes(2);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should throw error when trying to delete ADMIN system role', async () => {
      const adminRole = createMockRole({
        id: 'admin-id',
        name: 'ADMIN',
        isAdmin: true,
      });
      roleRepo.findOneByField.mockResolvedValue(adminRole);

      await expect(service.safelyDeleteRole('admin-id')).rejects.toThrow(
        CannotDeleteSystemRoleException,
      );

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: 'admin-id',
      });
      expect(userRepo.findUsersByRole).not.toHaveBeenCalled();
      expect(roleRepo.deleteRole).not.toHaveBeenCalled();
    });

    it('should throw error when trying to delete GUEST system role', async () => {
      const guestRole = createMockRole({
        id: 'guest-id',
        name: 'GUEST',
        isAdmin: false,
      });
      roleRepo.findOneByField.mockResolvedValue(guestRole);

      await expect(service.safelyDeleteRole('guest-id')).rejects.toThrow(
        CannotDeleteSystemRoleException,
      );

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: 'guest-id',
      });
      expect(userRepo.findUsersByRole).not.toHaveBeenCalled();
      expect(roleRepo.deleteRole).not.toHaveBeenCalled();
    });

    it('should throw error when trying to delete the last admin role', async () => {
      const adminRole = createMockRole({
        id: 'custom-admin-id',
        name: 'CUSTOM_ADMIN',
        isAdmin: true,
      });
      roleRepo.findOneByField.mockResolvedValue(adminRole);
      roleRepo.countAdminRoles.mockResolvedValue(1);

      await expect(service.safelyDeleteRole('custom-admin-id')).rejects.toThrow(
        CannotDeleteLastAdminRoleException,
      );

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: 'custom-admin-id',
      });
      expect(roleRepo.countAdminRoles).toHaveBeenCalled();
      expect(userRepo.findUsersByRole).not.toHaveBeenCalled();
      expect(roleRepo.deleteRole).not.toHaveBeenCalled();
    });

    it('should allow deleting admin role when there are multiple admin roles', async () => {
      const adminRole = createMockRole({
        id: 'custom-admin-id',
        name: 'CUSTOM_ADMIN',
        isAdmin: true,
      });
      roleRepo.findOneByField.mockResolvedValue(adminRole);
      roleRepo.countAdminRoles.mockResolvedValue(2);
      userRepo.findUsersByRole.mockResolvedValue([]);

      await service.safelyDeleteRole('custom-admin-id');

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: 'custom-admin-id',
      });
      expect(roleRepo.countAdminRoles).toHaveBeenCalled();
      expect(userRepo.findUsersByRole).toHaveBeenCalledWith('custom-admin-id');
      expect(roleRepo.deleteRole).toHaveBeenCalledWith('custom-admin-id');
    });
  });
});
