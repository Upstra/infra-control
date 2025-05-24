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

export class JwtNotValid extends Error {
  constructor(message: string = 'Le token fourni est invalide ou manquant') {
    super(message);
  }
}
