export class UpsNotFoundException extends Error {
  constructor(id: string) {
    super(`UPS with ID ${id} not found`);
    this.name = 'UpsNotFoundException';
  }
}
