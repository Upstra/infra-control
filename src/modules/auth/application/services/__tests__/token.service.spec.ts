import { TokenService } from '../token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jwtService = { sign: jest.fn() } as any;
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRATION':
            return '15m';
          case 'JWT_REFRESH_TOKEN_EXPIRATION':
            return '7d';
          case 'JWT_2FA_TOKEN_EXPIRATION':
            return '5m';
          default:
            return undefined;
        }
      }),
    } as any;

    service = new TokenService(jwtService, configService);
  });

  it('should generate access and refresh tokens', () => {
    jwtService.sign
      .mockReturnValueOnce('access.token')
      .mockReturnValueOnce('refresh.token');

    const result = service.generateTokens({ userId: '1' });

    expect(jwtService.sign).toHaveBeenNthCalledWith(
      1,
      { userId: '1' },
      { expiresIn: '15m' },
    );
    expect(jwtService.sign).toHaveBeenNthCalledWith(
      2,
      { userId: '1' },
      { expiresIn: '7d' },
    );
    expect(result).toEqual({
      accessToken: 'access.token',
      refreshToken: 'refresh.token',
    });
  });

  it('should generate a 2FA token', () => {
    jwtService.sign.mockReturnValue('2fa.token');

    const result = service.generate2FAToken({ userId: '1' });

    expect(jwtService.sign).toHaveBeenCalledWith(
      { userId: '1' },
      { expiresIn: '5m' },
    );
    expect(result).toBe('2fa.token');
  });
});
