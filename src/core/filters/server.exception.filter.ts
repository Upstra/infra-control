import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  ServerCreationException,
  ServerUpdateException,
  ServerDeletionException,
  ServerNotFoundException,
  ServerRetrievalException,
} from '@/modules/servers/domain/exceptions/server.exception';

@Catch(
  ServerCreationException,
  ServerUpdateException,
  ServerDeletionException,
  ServerNotFoundException,
  ServerRetrievalException,
)
export class ServerExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status: HttpStatus;
    if (
      exception instanceof ServerNotFoundException ||
      exception instanceof ServerRetrievalException
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof ServerCreationException ||
      exception instanceof ServerUpdateException ||
      exception instanceof ServerDeletionException
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
