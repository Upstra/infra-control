import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { TwoFAGuard } from '../guards/twofa.guard';

describe('TwoFAGuard', () => {
  let guard: TwoFAGuard;

  const DummyClass = class {
    noop() {} // no-op method to avoid sonar warning (S2094)
  };

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getArgByIndex: () => null,
      getArgs: () => [],
      getClass: () => DummyClass,
      getHandler: () => () => {},
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new TwoFAGuard();
  });

  it('should return true if 2FA is not enabled', () => {
    const context = createMockExecutionContext({ isTwoFactorEnabled: false });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user is undefined', () => {
    const context = createMockExecutionContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if 2FA is enabled', () => {
    const context = createMockExecutionContext({ isTwoFactorEnabled: true });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Le 2FA est déjà activé.'),
    );
  });
});
