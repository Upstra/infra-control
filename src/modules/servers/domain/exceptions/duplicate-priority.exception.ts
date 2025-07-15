export class DuplicateServerPriorityException extends Error {
  constructor(priority: number) {
    super(`Server priority ${priority} is already in use`);
    this.name = 'DuplicateServerPriorityException';
  }
}
