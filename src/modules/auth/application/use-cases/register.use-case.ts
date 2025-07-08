import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';
import { TokenService } from '../services/token.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';

/**
 * Registers a new user account and issues authentication tokens.
 *
 * Orchestrates the application-level registration flow by:
 * 1. Delegating user creation to the RegisterUserUseCase.
 * 2. Generating access and refresh tokens via the TokenService.
 *
 * @param dto  Data Transfer Object containing user credentials and profile info.
 * @returns     A token pair (access & refresh) for the newly created user.
 *
 * @remarks
 * Controllers should call this use-case rather than combining registration
 * and token issuance themselves.
 *
 * @example
 * const tokens = await registerUseCase.execute({ email, password, username });
 */

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly tokenService: TokenService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(dto: RegisterDto, requestContext?: RequestContextDto) {
    const user = await this.registerUserUseCase.execute(dto);

    await this.logHistory?.executeStructured({
      entity: 'auth',
      entityId: user.id,
      action: 'REGISTER_SUCCESS',
      userId: user.id,
      metadata: {
        registrationMethod: 'email',
        userEmail: user.email,
        userName: user.username,
        hasInitialRoles: user.roles?.length > 0,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isActive: user.isActive,
    });
  }
}
