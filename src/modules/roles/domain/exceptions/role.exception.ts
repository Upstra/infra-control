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
