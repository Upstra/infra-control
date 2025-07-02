import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { UserExceptionFilter } from '../user.exception.filter';
import {
  CannotDeleteLastAdminException,
  UserNotFoundException,
} from '@/modules/users/domain/exceptions/user.exception';

describe('UserExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) } as any;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;
    return { host, response, json };
  };

  it('returns 404 for UserNotFoundException', () => {
    const filter = new UserExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new UserNotFoundException('1'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: "Utilisateur avec l'ID 1 introuvable.",
    });
  });

  it('returns 409 for CannotDeleteLastAdminException', () => {
    const filter = new UserExceptionFilter();
    const { host, response, json } = createHost();
    filter.catch(new CannotDeleteLastAdminException('no'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({ statusCode: 409, message: 'no' });
  });
});
