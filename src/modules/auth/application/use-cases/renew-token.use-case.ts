import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Injectable()
export class RenewTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

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
        { expiresIn: '15m' },
      );

      const newRefreshToken = this.jwtService.sign(
        {
          userId: payload.userId,
          email: payload.email,
          isTwoFactorEnabled: payload.isTwoFactorEnabled,
          role: payload.role,
        },
        { expiresIn: '7d' },
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
