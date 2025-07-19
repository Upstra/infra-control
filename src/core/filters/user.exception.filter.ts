import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  UserNotFoundException,
  UserBadRequestException,
  UserUpdateException,
  UserDeletionException,
  UserRetrievalException,
  UserConflictException,
  UserRegistrationException,
  CannotDeleteLastAdminException,
  CannotRemoveLastAdminException,
  CannotDeleteOwnAccountException,
  CannotToggleOwnStatusException,
  CannotDeactivateLastAdminException,
} from '@/modules/users/domain/exceptions/user.exception';

@Catch(
  UserNotFoundException,
  UserBadRequestException,
  UserUpdateException,
  UserDeletionException,
  UserRetrievalException,
  UserConflictException,
  UserRegistrationException,
  CannotDeleteLastAdminException,
  CannotRemoveLastAdminException,
  CannotDeleteOwnAccountException,
  CannotToggleOwnStatusException,
  CannotDeactivateLastAdminException,
)
export class UserExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status;
    if (exception instanceof UserNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof UserConflictException ||
      exception instanceof CannotDeleteLastAdminException ||
      exception instanceof CannotRemoveLastAdminException ||
      exception instanceof CannotDeleteOwnAccountException ||
      exception instanceof CannotToggleOwnStatusException ||
      exception instanceof CannotDeactivateLastAdminException
    ) {
      status = HttpStatus.CONFLICT;
    } else if (
      exception instanceof UserBadRequestException ||
      exception instanceof UserUpdateException ||
      exception instanceof UserDeletionException ||
      exception instanceof UserRetrievalException ||
      exception instanceof UserRegistrationException
    ) {
      status = HttpStatus.BAD_REQUEST;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
