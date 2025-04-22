import { PermissionCreationException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(PermissionCreationException)
export class PermissionCreationExceptionFilter implements ExceptionFilter {
  catch(exception: PermissionCreationException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(500).json({
      statusCode: 500,
      message: exception.message,
    });
  }
}
