export class VmNotFoundException extends Error {
  constructor(id: string) {
    super(`VM with ID ${id} not found`);
    this.name = 'VmNotFoundException';
  }
}
