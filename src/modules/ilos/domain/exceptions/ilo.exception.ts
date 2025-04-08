export class IloNotFoundException extends Error {
  constructor(id: string) {
    super(`Ilo with id ${id} not found`);
    this.name = 'IloNotFoundException';
  }
}
