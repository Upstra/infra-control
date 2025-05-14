import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

@Catch(JwtNotValid)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: JwtNotValid, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      ...(process.env.NODE_ENV !== 'production' && {
        message: exception.message,
      }),
    });
  }
}
