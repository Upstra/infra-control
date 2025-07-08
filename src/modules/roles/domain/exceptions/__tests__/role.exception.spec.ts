import {
  RoleNotFoundException,
  RoleRetrievalException,
  AdminRoleAlreadyExistsException,
  CannotDeleteSystemRoleException,
  CannotDeleteLastAdminRoleException,
  SystemRoleNameAlreadyExistsException,
  CannotRemoveGuestRoleException,
  RoleExceptions,
} from '../role.exception';

describe('Role Exceptions', () => {
  describe('RoleNotFoundException', () => {
    it('should create exception with correct message', () => {
      const exception = new RoleNotFoundException('123');
      expect(exception.message).toBe('Role with ID 123 not found');
      expect(exception.name).toBe('RoleNotFoundException');
    });
  });

  describe('RoleRetrievalException', () => {
    it('should create exception with correct message', () => {
      const exception = new RoleRetrievalException();
      expect(exception.message).toBe('Error retrieving role');
      expect(exception.name).toBe('RoleRetrievalException');
    });
  });

  describe('AdminRoleAlreadyExistsException', () => {
    it('should create exception with default message', () => {
      const exception = new AdminRoleAlreadyExistsException();
      expect(exception.message).toBe('Admin role already exists');
      expect(exception.name).toBe('AdminRoleAlreadyExistsException');
    });

    it('should create exception with custom message', () => {
      const customMessage = 'Custom admin role error';
      const exception = new AdminRoleAlreadyExistsException(customMessage);
      expect(exception.message).toBe(customMessage);
      expect(exception.name).toBe('AdminRoleAlreadyExistsException');
    });
  });

  describe('CannotDeleteSystemRoleException', () => {
    it('should create exception with role name', () => {
      const exception = new CannotDeleteSystemRoleException('ADMIN');
      expect(exception.message).toBe(
        'Cannot delete system role: ADMIN. This role is required for the system to function properly.',
      );
      expect(exception.name).toBe('CannotDeleteSystemRoleException');
    });
  });

  describe('CannotDeleteLastAdminRoleException', () => {
    it('should create exception with correct message', () => {
      const exception = new CannotDeleteLastAdminRoleException();
      expect(exception.message).toBe(
        'Cannot delete the last admin role. At least one admin role must exist in the system.',
      );
      expect(exception.name).toBe('CannotDeleteLastAdminRoleException');
    });
  });

  describe('SystemRoleNameAlreadyExistsException', () => {
    it('should create exception with role name', () => {
      const exception = new SystemRoleNameAlreadyExistsException('GUEST');
      expect(exception.message).toBe(
        "Cannot create role with name 'GUEST'. This is a reserved system role name.",
      );
      expect(exception.name).toBe('SystemRoleNameAlreadyExistsException');
    });
  });

  describe('CannotRemoveGuestRoleException', () => {
    it('should create exception with correct message', () => {
      const exception = new CannotRemoveGuestRoleException();
      expect(exception.message).toBe('Cannot remove last guest role from user.');
      expect(exception.name).toBe('CannotRemoveGuestRoleException');
    });
  });

  describe('RoleExceptions static methods', () => {
    it('should create RoleNotFoundException via roleNotFound', () => {
      const exception = RoleExceptions.roleNotFound();
      expect(exception).toBeInstanceOf(RoleNotFoundException);
      expect(exception.message).toBe('Role with ID One or more roles not found not found');
      expect(exception.name).toBe('RoleNotFoundException');
    });

    it('should create error via cannotSpecifyBothRoleIdAndRoleIds', () => {
      const exception = RoleExceptions.cannotSpecifyBothRoleIdAndRoleIds();
      expect(exception.message).toBe('Cannot specify both roleId and roleIds');
      expect(exception.name).toBe('InvalidRoleUpdateException');
    });

    it('should create CannotRemoveGuestRoleException via cannotRemoveGuestRole', () => {
      const exception = RoleExceptions.cannotRemoveGuestRole();
      expect(exception).toBeInstanceOf(CannotRemoveGuestRoleException);
      expect(exception.message).toBe('Cannot remove last guest role from user.');
      expect(exception.name).toBe('CannotRemoveGuestRoleException');
    });
  });
});