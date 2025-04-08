export class RoleNotFoundException extends Error {
  constructor(id: string) {
    super(`Role with ID ${id} not found`);
    this.name = 'RoleNotFoundException';
  }
}
