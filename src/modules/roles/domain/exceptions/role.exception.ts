export class RoleNotFoundException extends Error {
  constructor(id: string) {
    super(`Role with ID ${id} not found`);
    this.name = 'RoleNotFoundException';
  }
}

export class RoleRetrievalException extends Error {
  constructor() {
    super(`Error retrieving role`);
    this.name = 'RoleRetrievalException';
  }
}

export class AdminRoleAlreadyExistsException extends Error {
  constructor(message = 'Admin role already exists') {
    super(message);
    this.name = 'AdminRoleAlreadyExistsException';
  }
}

export class CannotDeleteSystemRoleException extends Error {
  constructor(roleName: string) {
    super(
      `Cannot delete system role: ${roleName}. This role is required for the system to function properly.`,
    );
    this.name = 'CannotDeleteSystemRoleException';
  }
}

export class CannotDeleteLastAdminRoleException extends Error {
  constructor() {
    super(
      'Cannot delete the last admin role. At least one admin role must exist in the system.',
    );
    this.name = 'CannotDeleteLastAdminRoleException';
  }
}

export class SystemRoleNameAlreadyExistsException extends Error {
  constructor(roleName: string) {
    super(
      `Cannot create role with name '${roleName}'. This is a reserved system role name.`,
    );
    this.name = 'SystemRoleNameAlreadyExistsException';
  }
}
