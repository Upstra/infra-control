import { HttpException, HttpStatus } from '@nestjs/common';

export class RoleNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Role with ID ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'RoleNotFoundException';
  }
}
