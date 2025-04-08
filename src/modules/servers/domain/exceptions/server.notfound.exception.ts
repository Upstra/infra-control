export class ServerNotFoundException extends Error {
  constructor(id: string) {
    super(`Server with id ${id} not found`);
    this.name = 'ServerNotFoundException';
  }
}
