import { HttpStatus } from '@nestjs/common';
import { InactiveUserException } from './inactive-user.exception';

describe('InactiveUserException', () => {
  let exception: InactiveUserException;

  beforeEach(() => {
    exception = new InactiveUserException();
  });

  it('should be defined', () => {
    expect(exception).toBeDefined();
  });

  it('should be an instance of Error', () => {
    expect(exception).toBeInstanceOf(Error);
  });

  it('should have the correct status code', () => {
    expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
  });

  it('should have the correct error message', () => {
    const response = exception.getResponse() as any;
    expect(response.message).toBe(
      'Account is inactive. Please contact an administrator to activate your account.',
    );
  });

  it('should have the correct error property', () => {
    const response = exception.getResponse() as any;
    expect(response.error).toBe('Forbidden');
  });

  it('should have the correct statusCode in response', () => {
    const response = exception.getResponse() as any;
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('should return the complete error object', () => {
    const response = exception.getResponse() as any;
    expect(response).toEqual({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Account is inactive. Please contact an administrator to activate your account.',
      error: 'Forbidden',
    });
  });

  it('should have consistent name property', () => {
    expect(exception.name).toBe('InactiveUserException');
  });

  it('should be catchable as HttpException', () => {
    try {
      throw exception;
    } catch (error) {
      expect(error).toBeInstanceOf(InactiveUserException);
      expect((error as InactiveUserException).getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });
});