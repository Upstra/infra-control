import { SafeRoleDeletionDomainService } from '../safe-role-deletion.domain.service';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../interfaces/role.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

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
    } as any;

    service = new SafeRoleDeletionDomainService(userRepo, roleRepo);
  });

  describe('safelyDeleteRole', () => {
    it('should delete role when no users have it', async () => {
      const roleId = 'role-to-delete';
      userRepo.findUsersByRole.mockResolvedValue([]);

      await service.safelyDeleteRole(roleId);

      expect(userRepo.findUsersByRole).toHaveBeenCalledWith(roleId);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should reassign users with only deleted role to Guest role', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({ id: roleId, name: 'DEV' });
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

      userRepo.findUsersByRole.mockResolvedValue([user1, user2]);
      roleRepo.findOneByField.mockResolvedValue(guestRole);

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
      const roleToDelete = createMockRole({ id: roleId, name: 'DEV' });
      const adminRole = createMockRole({ id: 'admin-id', name: 'ADMIN' });

      const user = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete, adminRole],
      });

      userRepo.findUsersByRole.mockResolvedValue([user]);

      await service.safelyDeleteRole(roleId);

      expect(user.roles).toEqual([adminRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(roleRepo.findOneByField).not.toHaveBeenCalled(); // No need for Guest role
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should create Guest role if it does not exist', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({ id: roleId, name: 'DEV' });
      const guestRole = createMockRole({ id: 'guest-id', name: 'GUEST' });

      const user = createMockUser({
        id: 'user1',
        username: 'user1',
        roles: [roleToDelete],
      });

      userRepo.findUsersByRole.mockResolvedValue([user]);
      roleRepo.findOneByField.mockRejectedValue(new Error('Role not found'));
      roleRepo.createRole.mockResolvedValue(guestRole);
      roleRepo.save.mockResolvedValue(guestRole);

      await service.safelyDeleteRole(roleId);

      expect(roleRepo.findOneByField).toHaveBeenCalledWith({
        field: 'name',
        value: 'GUEST',
      });
      expect(roleRepo.createRole).toHaveBeenCalledWith('GUEST');
      expect(roleRepo.save).toHaveBeenCalledWith(guestRole);
      expect(user.roles).toEqual([guestRole]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should handle mixed scenario with users having different role combinations', async () => {
      const roleId = 'role-to-delete';
      const roleToDelete = createMockRole({ id: roleId, name: 'DEV' });
      const adminRole = createMockRole({ id: 'admin-id', name: 'ADMIN' });
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

      userRepo.findUsersByRole.mockResolvedValue([
        userWithOnlyDeletedRole,
        userWithMultipleRoles,
      ]);
      roleRepo.findOneByField.mockResolvedValue(guestRole);

      await service.safelyDeleteRole(roleId);

      expect(userWithOnlyDeletedRole.roles).toEqual([guestRole]);
      expect(userWithMultipleRoles.roles).toEqual([adminRole]);
      expect(userRepo.save).toHaveBeenCalledTimes(2);
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(roleId);
    });
  });
});
