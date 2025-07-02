import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  RoleRetrievalException,
  RoleNotFoundException,
  AdminRoleAlreadyExistsException,
} from '@/modules/roles/domain/exceptions/role.exception';

@Catch(RoleRetrievalException, RoleNotFoundException, AdminRoleAlreadyExistsException)
export class RoleExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof RoleNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof AdminRoleAlreadyExistsException) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
