import { HttpException, HttpStatus } from '@nestjs/common';

export class InactiveUserException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message:
          'Account is inactive. Please contact an administrator to activate your account.',
        error: 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
