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
  InvalidRoleUpdateException,
  CannotDeleteLastAdminRoleException,
  CannotRemoveGuestRoleException,
} from '@/modules/roles/domain/exceptions/role.exception';

@Catch(
  RoleNotFoundException,
  RoleRetrievalException,
  AdminRoleAlreadyExistsException,
  CannotDeleteSystemRoleException,
  CannotDeleteLastAdminRoleException,
  InvalidRoleUpdateException,
  SystemRoleNameAlreadyExistsException,
  CannotRemoveGuestRoleException,
)
export class RoleExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status: HttpStatus;
    if (
      exception instanceof RoleNotFoundException ||
      exception instanceof RoleRetrievalException
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof AdminRoleAlreadyExistsException ||
      exception instanceof SystemRoleNameAlreadyExistsException
    ) {
      status = HttpStatus.CONFLICT;
    } else if (
      exception instanceof CannotDeleteSystemRoleException ||
      exception instanceof CannotDeleteLastAdminRoleException ||
      exception instanceof InvalidRoleUpdateException ||
      exception instanceof CannotRemoveGuestRoleException
    ) {
      status = HttpStatus.FORBIDDEN;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
