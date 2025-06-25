import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Injectable()
export class RenewTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  execute(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<
        JwtPayload & { isTwoFactorEnabled?: boolean; role?: any }
      >(refreshToken);

      const accessToken = this.jwtService.sign(
        {
          userId: payload.userId,
          email: payload.email,
          isTwoFactorEnabled: payload.isTwoFactorEnabled,
          role: payload.role,
        },
        {
          expiresIn: this.configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION',
          ),
        },
      );

      const newRefreshToken = this.jwtService.sign(
        {
          userId: payload.userId,
          email: payload.email,
          isTwoFactorEnabled: payload.isTwoFactorEnabled,
          role: payload.role,
        },
        {
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION',
          ),
        },
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
