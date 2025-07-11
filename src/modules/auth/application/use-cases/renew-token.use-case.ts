import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExtendedJwtPayload } from '../../domain/interfaces/extended-jwt-payload.interface';
import { TokenService } from '../services/token.service';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

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
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<ExtendedJwtPayload>(refreshToken);

      let isActive = payload.isActive;

      if (isActive === undefined) {
        const user = await this.userRepository.findOneById(payload.userId);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        isActive = user.isActive;
      }

      const tokens = this.tokenService.generateTokens({
        userId: payload.userId,
        email: payload.email,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
        role: payload.role,
        roles: payload.roles,
        isActive,
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
