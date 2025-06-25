import { RenewTokenUseCase } from '../renew-token.use-case';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('RenewTokenUseCase', () => {
  let useCase: RenewTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRATION':
            return '15m';
          case 'JWT_REFRESH_TOKEN_EXPIRATION':
            return '7d';
          default:
            return undefined;
        }
      }),
    } as any;

    useCase = new RenewTokenUseCase(jwtService, configService);
  });

  it('should return a renewed token', () => {
    const refreshToken = 'refresh.token';
    const payload: JwtPayload & { isTwoFactorEnabled?: boolean; role?: any } = {
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
      role: { id: '1', name: 'admin' },
    };

    jwtService.verify.mockReturnValue(payload);

    jwtService.sign
      .mockReturnValueOnce('new.access.token')
      .mockReturnValueOnce('new.refresh.token');

    const result = useCase.execute(refreshToken);

    expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: payload.userId,
        email: payload.email,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
        role: payload.role,
      },
      { expiresIn: '15m' },
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: payload.userId,
        email: payload.email,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
        role: payload.role,
      },
      { expiresIn: '7d' },
    );
    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
  });

  it('should throw UnauthorizedException when verification fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => useCase.execute('bad.token')).toThrow('Invalid or expired refresh token');
  });
});
