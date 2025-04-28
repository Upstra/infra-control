import {
  VmCreationException,
  VmDeletionException,
  VmNotFoundException,
  VmRetrievalException,
  VmUpdateException,
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
)
export class VmExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    const status =
      exception instanceof VmNotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
