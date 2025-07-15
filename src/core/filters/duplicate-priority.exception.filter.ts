import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DuplicateServerPriorityException } from '@/modules/servers/domain/exceptions/duplicate-priority.exception';

@Catch(DuplicateServerPriorityException)
export class DuplicatePriorityExceptionFilter implements ExceptionFilter {
  catch(exception: DuplicateServerPriorityException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message: exception.message,
      error: 'Conflict',
    });
  }
}