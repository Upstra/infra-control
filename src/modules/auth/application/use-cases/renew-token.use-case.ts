import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExtendedJwtPayload } from '../../domain/interfaces/extended-jwt-payload.interface';
import { TokenService } from '../services/token.service';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { InvalidTokenException } from '../../domain/exceptions/invalid-token.exception';

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
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new InvalidTokenException('Refresh token is missing or invalid');
    }

    try {
      const payload = this.jwtService.verify<ExtendedJwtPayload>(refreshToken);

      let isActive = payload.isActive;

      if (isActive === undefined) {
        const userStatus = await this.userRepository.getUserActiveStatus(
          payload.userId,
        );
        if (!userStatus) {
          throw new UnauthorizedException('User not found');
        }
        isActive = userStatus.isActive;
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

      // Check if it's a JWT format error
      if (
        error.name === 'JsonWebTokenError' ||
        error.message?.includes('malformed')
      ) {
        throw new InvalidTokenException('Malformed refresh token');
      }

      // For other errors (like TokenExpiredError), return 401
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
