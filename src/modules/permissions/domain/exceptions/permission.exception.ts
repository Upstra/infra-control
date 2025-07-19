export class PermissionCreationException extends Error {
  constructor(message = 'Failed to create permission') {
    super(message);
    this.name = 'PermissionCreationException';
  }
}

export class PermissionNotFoundException extends Error {
  constructor(type?: 'server' | 'vm', id?: string, message?: string) {
    super(
      message || id
        ? `Permission ${type} not found (id=${id})`
        : `Permission ${type} not found`,
    );
    this.name = 'PermissionNotFoundException';
  }
}

export class PermissionDeletionException extends Error {
  constructor(message = 'Failed to delete permission') {
    super(message);
    this.name = 'PermissionDeletionException';
  }
}

export class PermissionInvalidValueException extends Error {
  constructor(field: string) {
    super(`Invalid value for ${field}`);
    this.name = 'PermissionInvalidValueException';
  }
}
