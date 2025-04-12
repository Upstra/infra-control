import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthNotFoundException extends HttpException {
  constructor() {
    super('User not found', HttpStatus.UNAUTHORIZED);
  }
}
export class AuthPasswordNotValidException extends HttpException {
  constructor() {
    super('Password or username not valid', HttpStatus.UNAUTHORIZED);
  }
}
