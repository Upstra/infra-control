import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

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
