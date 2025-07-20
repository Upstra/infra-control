import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class PythonErrorInterceptor implements ExceptionFilter {
  private readonly logger = new Logger(PythonErrorInterceptor.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: HttpStatus;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.message) {
      if (
        exception.message.includes('Authentication failed') ||
        exception.message.includes('401')
      ) {
        status = HttpStatus.UNAUTHORIZED;
        message = 'Invalid credentials';
      } else if (
        exception.message.includes('not found') ||
        exception.message.includes('404')
      ) {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
      } else if (exception.message.includes('timeout')) {
        status = HttpStatus.REQUEST_TIMEOUT;
        message = 'Operation timeout';
      } else if (exception.message.includes('Script execution failed')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
      } else if (exception.message.includes('ModuleNotFoundError')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Python environment configuration error';
      } else if (exception.message.includes('Traceback')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Python script execution error';
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    this.logger.error(
      `Python script error: ${message}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
