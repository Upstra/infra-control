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
  CannotDeleteSystemRoleException,
  SystemRoleNameAlreadyExistsException,
} from '@/modules/roles/domain/exceptions/role.exception';

@Catch(
  RoleRetrievalException,
  RoleNotFoundException,
  AdminRoleAlreadyExistsException,
  CannotDeleteSystemRoleException,
  SystemRoleNameAlreadyExistsException,
)
export class RoleExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof RoleNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof AdminRoleAlreadyExistsException ||
      exception instanceof SystemRoleNameAlreadyExistsException
    ) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof CannotDeleteSystemRoleException) {
      status = HttpStatus.FORBIDDEN;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
