import { RenewTokenUseCase } from '../renew-token.use-case';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { ExtendedJwtPayload } from '../../../domain/interfaces/extended-jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';

describe('RenewTokenUseCase', () => {
  let useCase: RenewTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    } as any;

    tokenService = {
      generateTokens: jest.fn(),
    } as any;

    useCase = new RenewTokenUseCase(jwtService, tokenService);
  });

  it('should return a renewed token', () => {
    const refreshToken = 'refresh.token';
    const mockJwtPayload = createMockJwtPayload({
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
      isActive: true,
    });
    const payload: ExtendedJwtPayload = {
      ...mockJwtPayload,
      roles: [mockJwtPayload.role],
    };

    jwtService.verify.mockReturnValue(payload);

    tokenService.generateTokens.mockReturnValue({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });

    const result = useCase.execute(refreshToken);

    expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: payload.userId,
      email: payload.email,
      isTwoFactorEnabled: payload.isTwoFactorEnabled,
      role: payload.role,
      roles: payload.roles,
      isActive: payload.isActive,
    });
    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
  });

  it('should throw UnauthorizedException when verification fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => useCase.execute('bad.token')).toThrow(
      'Invalid or expired refresh token',
    );
  });
});
