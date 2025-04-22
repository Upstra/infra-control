import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';

@Catch(PermissionNotFoundException)
export class PermissionNotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: PermissionNotFoundException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(404).json({
      statusCode: 404,
      message: exception.message,
    });
  }
}
