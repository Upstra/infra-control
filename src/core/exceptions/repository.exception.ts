import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

export class InvalidQueryValueException extends Error {
  constructor(field: string, value: any) {
    super(`Invalid value '${value}' for field '${field}'`);
    this.name = 'InvalidQueryValueException';
  }
}

@Catch(InvalidQueryValueException)
export class InvalidQueryExceptionFilter implements ExceptionFilter {
  catch(exception: InvalidQueryValueException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(400).json({
      statusCode: 400,
      message: exception.message,
    });
  }
}
