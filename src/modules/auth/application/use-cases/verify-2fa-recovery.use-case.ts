import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../services/token.service';

import { JwtPayload } from '@/core/types/jwt-payload.interface';

import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';
import { TwoFARecoveryDto, TwoFAResponseDto } from '../dto/twofa.dto';

/**
 * Handles login via 2FA recovery codes when the user cannot use TOTP.
 *
 * Responsibilities:
 * - Retrieves the user and existing recovery codes via GetUserByEmailUseCase.
 * - Normalizes and compares the supplied code against stored hashed codes.
 * - Marks the used code as consumed and updates the user record.
 * - Issues a 2FA authentication token on successful recovery.
 *
 * @param userJwt         JwtPayload for the user context.
 * @param dto             TwoFARecoveryDto with the recovery code.
 * @returns               TwoFAResponseDto with auth token and success message.
 *
 * @throws ForbiddenException if no valid recovery codes remain or code does not match.
 *
 * @example
 * const resp = await verify2FARecoveryUseCase.execute(jwtPayload, { recoveryCode });
 */

@Injectable()
export class Verify2FARecoveryUseCase {
  constructor(
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly updateUserFieldsUseCase: UpdateUserFieldsUseCase,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    userJwt: JwtPayload,
    dto: TwoFARecoveryDto,
  ): Promise<TwoFAResponseDto> {
    const user = await this.getUserByEmailUseCase.execute(userJwt.email);
    if (!user || !user.recoveryCodes || user.recoveryCodes.length === 0) {
      throw new ForbiddenException('Aucun code de récupération disponible.');
    }

    const bcrypt = await import('bcryptjs');

    const cleanedCode = dto.recoveryCode
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase();
    const formattedCode =
      cleanedCode.match(/.{1,4}/g)?.join('-') ?? cleanedCode;

    let usedCodeIndex: number | null = null;

    for (let i = 0; i < user.recoveryCodes.length; i++) {
      const match = await bcrypt.compare(formattedCode, user.recoveryCodes[i]);
      if (match) {
        usedCodeIndex = i;
        break;
      }
    }

    if (usedCodeIndex === null) {
      throw new ForbiddenException('Code de récupération invalide.');
    }

    const updatedCodes = user.recoveryCodes.filter(
      (_, idx) => idx !== usedCodeIndex,
    );

    await this.updateUserFieldsUseCase.execute(user.id, {
      recoveryCodes: updatedCodes,
    });

    const accessToken = this.tokenService.generate2FAToken({
      userId: user.id,
      email: user.email,
      isTwoFactorAuthenticated: true,
      isActive: user.isActive,
      roles: user.roles,
    });

    return new TwoFAResponseDto(
      true,
      accessToken,
      'Connexion via recovery code réussie.',
    );
  }
}
