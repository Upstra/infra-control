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

    const status =
      exception instanceof RoomNotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
