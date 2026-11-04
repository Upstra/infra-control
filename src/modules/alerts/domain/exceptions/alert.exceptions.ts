import { ConflictException, NotFoundException } from '@nestjs/common';

export class AlertNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Alert ${id} not found`);
  }
}

export class AlertAlreadyResolvedException extends ConflictException {
  constructor(id: string) {
    super(`Alert ${id} is already resolved`);
  }
}
