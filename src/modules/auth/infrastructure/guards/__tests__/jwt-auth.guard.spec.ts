import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let response: {
    setHeader: jest.MockedFunction<(name: string, value: string) => void>;
  };
  let context: ExecutionContext;
  let superHandle: jest.SpyInstance;

  beforeEach(() => {
    jwtService = { sign: jest.fn().mockReturnValue('signed') } as any;
    guard = new JwtAuthGuard(jwtService);
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

  it('adds access token header when user exists', () => {
    const user = { userId: '1', email: 'a@test.com' } as any;
    const result = guard.handleRequest(null, user, null, context);
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: '1',
        email: 'a@test.com',
        isTwoFactorEnabled: undefined,
        role: undefined,
      },
      { expiresIn: undefined },
    );
    expect(response.setHeader).toHaveBeenCalledWith('x-access-token', 'signed');
    expect(superHandle).toHaveBeenCalledWith(null, user, null, context);
    expect(result).toBe('result');
  });

  it('does nothing when user absent', () => {
    const result = guard.handleRequest(null, null as any, null, context);
    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(superHandle).toHaveBeenCalledWith(null, null, null, context);
    expect(result).toBe('result');
  });
});
