import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  PermissionCreationException,
  PermissionDeletionException,
  PermissionNotFoundException,
} from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionCreationExceptionFilter } from '../permission/creation.exception.filter';
import { PermissionDeletionExceptionFilter } from '../permission/deletion.exception.filter';
import { PermissionNotFoundExceptionFilter } from '../permission/not-found.exception.filter';

describe('PermissionFilters', () => {
  const createHost = () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) } as any;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;
    return { host, response, json };
  };

  it('PermissionCreationExceptionFilter returns 500', () => {
    const filter = new PermissionCreationExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new PermissionCreationException('oops'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({ statusCode: 500, message: 'oops' });
  });

  it('PermissionDeletionExceptionFilter returns 500', () => {
    const filter = new PermissionDeletionExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new PermissionDeletionException('del'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({ statusCode: 500, message: 'del' });
  });

  it('PermissionNotFoundExceptionFilter returns 404', () => {
    const filter = new PermissionNotFoundExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new PermissionNotFoundException('server', '1'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Permission server not found (id=1)',
    });
  });
});
