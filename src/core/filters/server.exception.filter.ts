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
    const status =
      exception instanceof ServerNotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
