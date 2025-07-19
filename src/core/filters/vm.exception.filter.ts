import {
  VmNotFoundException,
  VmCreationException,
  VmUpdateException,
  VmDeletionException,
  VmRetrievalException,
  VmInvalidQueryException,
} from '@/modules/vms/domain/exceptions/vm.exception';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';

@Catch(
  VmNotFoundException,
  VmCreationException,
  VmUpdateException,
  VmDeletionException,
  VmRetrievalException,
  VmInvalidQueryException,
)
export class VmExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let status: HttpStatus;
    if (
      exception instanceof VmNotFoundException ||
      exception instanceof VmRetrievalException
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof VmCreationException ||
      exception instanceof VmUpdateException ||
      exception instanceof VmDeletionException ||
      exception instanceof VmInvalidQueryException
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
