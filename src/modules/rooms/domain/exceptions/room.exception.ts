import { HttpException, HttpStatus } from '@nestjs/common';

export class RoomNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Room with ID ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'RoomNotFoundException';
  }
}
