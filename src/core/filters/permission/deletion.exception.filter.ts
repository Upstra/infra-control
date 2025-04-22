import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { PermissionDeletionException } from '@/modules/permissions/domain/exceptions/permission.exception';

@Catch(PermissionDeletionException)
export class PermissionDeletionExceptionFilter implements ExceptionFilter {
  catch(exception: PermissionDeletionException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(500).json({
      statusCode: 500,
      message: exception.message,
    });
  }
}
