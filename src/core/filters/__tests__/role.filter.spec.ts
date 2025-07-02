import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RoleExceptionFilter } from '../role.exception.filter';
import {
  AdminRoleAlreadyExistsException,
  CannotDeleteSystemRoleException,
  RoleNotFoundException,
} from '@/modules/roles/domain/exceptions/role.exception';

describe('RoleExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) } as any;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;
    return { host, response, json };
  };

  it('returns 404 for RoleNotFoundException', () => {
    const filter = new RoleExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new RoleNotFoundException('1'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Role with ID 1 not found',
    });
  });

  it('returns 409 for AdminRoleAlreadyExistsException', () => {
    const filter = new RoleExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new AdminRoleAlreadyExistsException('exists'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({ statusCode: 409, message: 'exists' });
  });

  it('returns 403 for CannotDeleteSystemRoleException', () => {
    const filter = new RoleExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new CannotDeleteSystemRoleException('ADMIN'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Cannot delete system role: ADMIN. This role is required for the system to function properly.',
    });
  });
});
