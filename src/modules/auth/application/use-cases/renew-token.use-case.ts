import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TokenService } from '../services/token.service';

@Injectable()
export class RenewTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  execute(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<
        JwtPayload & { isTwoFactorEnabled?: boolean; role?: any }
      >(refreshToken);

      const tokens = this.tokenService.generateTokens({
        userId: payload.userId,
        email: payload.email,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
        role: payload.role,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
