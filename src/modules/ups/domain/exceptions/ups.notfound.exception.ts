import { HttpException, HttpStatus } from '@nestjs/common';

export class UpsNotFoundException extends HttpException {
  constructor(id: string) {
    super(`UPS with ID ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'UpsNotFoundException';
  }
}
