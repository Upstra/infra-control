import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { UserDomainService } from '../../../users/domain/services/user.domain.service';
import {
  AuthNotFoundException,
  AuthPasswordNotValidException,
} from '../../domain/exceptions/auth.exception';
import {
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
} from '@/modules/users/application/use-cases';
import { LoginResponseDto } from '../dto';
import { TokenService } from '../services/token.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';

/**
 * Authenticates a user by verifying credentials and handling 2FA requirements.
 *
 * Responsibilities:
 * - Determines lookup method (username vs. email) and retrieves the User.
 * - Validates the supplied password via UserDomainService.
 * - If 2FA is enabled, returns a temporary 2FA token indicating next step.
 * - Otherwise, issues full access and refresh tokens via TokenService.
 *
 * @param dto  LoginDto containing identifier (email/username) and password.
 * @returns    LoginResponseDto with tokens or 2FA requirement flag.
 *
 * @throws    AuthNotFoundException if no matching user is found.
 * @throws    AuthPasswordNotValidException if password check fails.
 *
 * @example
 * const response = await loginUseCase.execute({ identifier, password });
 */

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly findByUsername: GetUserByUsernameUseCase,
    private readonly findByEmail: GetUserByEmailUseCase,
    private readonly userDomain: UserDomainService,
    private readonly tokenService: TokenService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: LoginDto,
    requestContext?: RequestContextDto,
  ): Promise<LoginResponseDto> {
    const { identifier, password } = dto;
    const isEmail =
      identifier.includes('@') && identifier.split('@').length === 2;

    const user = isEmail
      ? await this.findByEmail.execute(identifier)
      : await this.findByUsername.execute(identifier);

    if (!user) {
      await this.logHistory?.executeStructured({
        entity: 'auth',
        entityId: 'unknown',
        action: 'LOGIN_FAILED',
        metadata: {
          reason: 'user_not_found',
          identifier: identifier.substring(0, 3) + '***',
          loginMethod: isEmail ? 'email' : 'username',
        },
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new AuthNotFoundException();
    }

    const isValidPassword = await this.userDomain.validatePassword(
      user.password,
      password,
    );

    if (!isValidPassword) {
      await this.logHistory?.executeStructured({
        entity: 'auth',
        entityId: user.id,
        action: 'LOGIN_FAILED',
        userId: user.id,
        metadata: {
          reason: 'invalid_password',
          identifier: identifier.substring(0, 3) + '***',
          loginMethod: isEmail ? 'email' : 'username',
        },
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new AuthPasswordNotValidException();
    }

    const requires2FA = this.userDomain.isTwoFactorEnabled(user);

    await this.logHistory?.executeStructured({
      entity: 'auth',
      entityId: user.id,
      action: requires2FA ? 'LOGIN_2FA_REQUIRED' : 'LOGIN_SUCCESS',
      userId: user.id,
      metadata: {
        loginMethod: isEmail ? 'email' : 'username',
        requires2FA,
        userActive: user.isActive,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    if (requires2FA) {
      const tempToken = this.tokenService.generate2FAToken({
        userId: user.id,
        step: '2fa',
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        isActive: user.isActive,
      });

      return {
        requiresTwoFactor: true,
        twoFactorToken: tempToken,
      };
    }

    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isActive: user.isActive,
    });
  }
}
