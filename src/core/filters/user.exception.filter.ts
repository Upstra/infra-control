import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  UserConflictException,
  UserDeletionException,
  UserNotFoundException,
  UserRegistrationException,
  UserRetrievalException,
  UserUpdateException,
  CannotDeleteLastAdminException,
  CannotRemoveLastAdminException,
} from '@/modules/users/domain/exceptions/user.exception';

@Catch(
  UserNotFoundException,
  UserConflictException,
  UserUpdateException,
  UserDeletionException,
  UserRetrievalException,
  UserRegistrationException,
  CannotDeleteLastAdminException,
  CannotRemoveLastAdminException,
)
export class UserExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UserNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof UserConflictException ||
      exception instanceof CannotDeleteLastAdminException ||
      exception instanceof CannotRemoveLastAdminException
    ) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
