export class PermissionNotFoundException extends Error {
  constructor() {
    super(`Permission not found`);
    this.name = 'PermissionNotFoundException';
  }
}
