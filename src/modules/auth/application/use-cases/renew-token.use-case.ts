import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TokenService } from '../services/token.service';

/**
 * Validates a refresh token and issues new authentication tokens.
 *
 * Responsibilities:
 * - Verifies the refresh token payload using JwtService.
 * - Extracts user identity and 2FA status from the token.
 * - Generates a new set of access and refresh tokens via TokenService.
 *
 * @param refreshToken  The JWT refresh token to validate.
 * @returns             New token pair if validation succeeds.
 *
 * @throws UnauthorizedException if the token is invalid or expired.
 *
 * @example
 * const newTokens = renewTokenUseCase.execute(existingRefreshToken);
 */

@Injectable()
export class RenewTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  execute(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<
        JwtPayload & { isTwoFactorEnabled?: boolean; role?: any; roles?: any[]; isActive?: boolean }
      >(refreshToken);

      const tokens = this.tokenService.generateTokens({
        userId: payload.userId,
        email: payload.email,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
        role: payload.role,
        roles: payload.roles,
        isActive: payload.isActive,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
