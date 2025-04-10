export class UserConflictException extends Error {
  constructor(username: string) {
    super(`User with username ${username} already exists`);
    this.name = 'UserConflictException';
  }
}
