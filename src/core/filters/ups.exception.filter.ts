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
  UpsInvalidQueryException,
} from '@/modules/ups/domain/exceptions/ups.exception';

@Catch(
  UpsNotFoundException,
  UpsCreationException,
  UpsUpdateException,
  UpsDeletionException,
  UpsRetrievalException,
  UpsInvalidQueryException,
)
export class UpsExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status: HttpStatus;
    if (
      exception instanceof UpsNotFoundException ||
      exception instanceof UpsRetrievalException
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof UpsCreationException ||
      exception instanceof UpsUpdateException ||
      exception instanceof UpsDeletionException ||
      exception instanceof UpsInvalidQueryException
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
