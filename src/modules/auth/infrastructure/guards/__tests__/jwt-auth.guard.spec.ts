import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let _jwtService: jest.Mocked<JwtService>;
  let response: {
    setHeader: jest.MockedFunction<(name: string, value: string) => void>;
  };
  let context: ExecutionContext;
  let superHandle: jest.SpyInstance;

  beforeEach(() => {
    _jwtService = { sign: jest.fn() } as any;
    guard = new JwtAuthGuard();
    response = { setHeader: jest.fn() } as any;
    context = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as any;
    const parent = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    superHandle = jest.spyOn(parent, 'handleRequest').mockReturnValue('result');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates to super.handleRequest when user exists', () => {
    const user = { userId: '1', email: 'a@test.com' } as any;
    const result = guard.handleRequest(null, user, null, context);
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(superHandle).toHaveBeenCalledWith(null, user, null, context);
    expect(result).toBe('result');
  });

  it('delegates to super.handleRequest when user absent', () => {
    const result = guard.handleRequest(null, null as any, null, context);
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(superHandle).toHaveBeenCalledWith(null, null, null, context);
    expect(result).toBe('result');
  });
});
