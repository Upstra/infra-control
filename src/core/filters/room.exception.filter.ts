import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  RoomCreationException,
  RoomUpdateException,
  RoomNotFoundException,
  RoomDeletionException,
} from '@/modules/rooms/domain/exceptions/room.exception';

@Catch(
  RoomCreationException,
  RoomUpdateException,
  RoomNotFoundException,
  RoomDeletionException,
)
export class RoomExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status: HttpStatus;
    if (exception instanceof RoomNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof RoomCreationException ||
      exception instanceof RoomUpdateException ||
      exception instanceof RoomDeletionException
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
