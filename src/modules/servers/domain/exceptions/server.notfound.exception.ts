import { HttpException, HttpStatus } from '@nestjs/common';

export class ServerNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Server with id ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'ServerNotFoundException';
  }
}
