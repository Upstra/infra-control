import { HttpException, HttpStatus } from '@nestjs/common';

export class VmNotFoundException extends HttpException {
  constructor(id: string) {
    super(`VM with ID ${id} not found`, HttpStatus.NOT_FOUND);
    this.name = 'VmNotFoundException';
  }
}
