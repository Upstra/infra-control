import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidTokenException extends HttpException {
  constructor(message: string = 'Invalid token format') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
