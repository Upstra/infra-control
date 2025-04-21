import { HttpException, HttpStatus } from '@nestjs/common';

export class IloNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Ilo with id ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'IloNotFoundException';
  }
}
