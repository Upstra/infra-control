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
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const { identifier, password } = dto;
    const isEmail =
      identifier.includes('@') && identifier.split('@').length === 2;

    const user = isEmail
      ? await this.findByEmail.execute(identifier)
      : await this.findByUsername.execute(identifier);

    if (!user) throw new AuthNotFoundException();

    const isValidPassword = await this.userDomain.validatePassword(
      user.password,
      password,
    );
    if (!isValidPassword) throw new AuthPasswordNotValidException();

    if (this.userDomain.isTwoFactorEnabled(user)) {
      const tempToken = this.tokenService.generate2FAToken({
        userId: user.id,
        step: '2fa',
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
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
    });
  }
}
