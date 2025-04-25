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
} from '@/modules/users/domain/exceptions/user.exception';

@Catch(
  UserNotFoundException,
  UserConflictException,
  UserUpdateException,
  UserDeletionException,
  UserRetrievalException,
  UserRegistrationException,
)
export class UserExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UserNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof UserConflictException) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
