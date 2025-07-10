import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  SystemSettingsNotFoundException,
  InvalidSettingsCategoryException,
  EmailConfigurationException,
  SettingsImportException,
} from '../../domain/exceptions/system-settings.exceptions';

@Catch(
  SystemSettingsNotFoundException,
  InvalidSettingsCategoryException,
  EmailConfigurationException,
  SettingsImportException,
)
export class SystemSettingsExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    let message = exception.message;

    if (exception instanceof SystemSettingsNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}