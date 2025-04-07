export class RoomNotFoundException extends Error {
  constructor(id: string) {
    super(`Room with ID ${id} not found`);
    this.name = 'RoomNotFoundException';
  }
}
