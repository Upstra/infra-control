export class PermissionCreationException extends Error {
  constructor(message = 'Failed to create permission') {
    super(message);
    this.name = 'PermissionCreationException';
  }
}

export class PermissionNotFoundException extends Error {
  constructor(message = 'Permission not found') {
    super(message);
    this.name = 'PermissionNotFoundException';
  }
}

export class PermissionDeletionException extends Error {
  constructor(message = 'Failed to delete permission') {
    super(message);
    this.name = 'PermissionDeletionException';
  }
}
