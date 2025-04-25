import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  UpsCreationException,
  UpsUpdateException,
  UpsDeletionException,
  UpsNotFoundException,
  UpsRetrievalException,
} from '@/modules/ups/domain/exceptions/ups.exception';

@Catch(
  UpsCreationException,
  UpsUpdateException,
  UpsDeletionException,
  UpsNotFoundException,
  UpsRetrievalException,
)
export class UpsExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    const status =
      exception instanceof UpsNotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
