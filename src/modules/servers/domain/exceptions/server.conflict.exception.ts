export class ServerConflictException extends Error {
  constructor(id: string) {
    super(`Server with id ${id} not found`);
    this.name = 'ServerConflictException';
  }
}
