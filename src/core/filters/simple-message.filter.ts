import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Type,
} from '@nestjs/common';

export function createSimpleMessageFilter(
  exceptionType: Type<Error>,
  status: HttpStatus,
): Type<ExceptionFilter> {
  @Catch(exceptionType)
  class SimpleMessageFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
      const response = host.switchToHttp().getResponse();
      response.status(status).json({
        statusCode: status,
        message: exception.message,
      });
    }
  }
  return SimpleMessageFilter;
}
