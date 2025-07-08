import { RecoveryCodeService } from './../../domain/services/recovery-code.domain.service';
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../services/token.service';

import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADto, TwoFAResponseDto } from '../dto/twofa.dto';
import { TwoFAInvalidCodeException } from '../../domain/exceptions/twofa.exception';

import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';
import { UserExceptions } from '@/modules/users/domain/exceptions/user.exception';

/**
 * Verifies a submitted TOTP code and handles 2FA activation if not already enabled.
 *
 * Responsibilities:
 * - Confirms user existence via GetUserByEmailUseCase.
 * - Validates the TOTP code against the stored secret using speakeasy.
 * - On first-time enable, generates and hashes recovery codes, updates user record.
 * - Issues a short-lived 2FA authentication token for subsequent flows.
 *
 * @param userJwtPayload  JwtPayload representing the authenticated login step.
 * @param dto             TwoFADto containing the TOTP code to verify.
 * @returns               TwoFAResponseDto with 2FA auth token, message, and any new recovery codes.
 *
 * @throws TwoFAInvalidCodeException if the TOTP code is invalid.
 *
 * @example
 * const response = await verify2FAUseCase.execute(jwtPayload, { code });
 */

@Injectable()
export class Verify2FAUseCase {
  constructor(
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly updateUserFieldsUseCase: UpdateUserFieldsUseCase,
    private readonly recoveryCodeService: RecoveryCodeService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    userJwtPayload: JwtPayload,
    dto: TwoFADto,
  ): Promise<TwoFAResponseDto> {
    let message: string = '2FA verified successfully.';

    const user = await this.getUserByEmailUseCase.execute(userJwtPayload.email);
    if (!user) throw UserExceptions.notFound(userJwtPayload.email);

    const isValid: boolean = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!isValid) throw new TwoFAInvalidCodeException();

    let recoveryCodes: string[] | undefined;
    if (!user.isTwoFactorEnabled) {
      recoveryCodes = this.recoveryCodeService.generate();
      const hashedCodes = await this.recoveryCodeService.hash(recoveryCodes);

      await this.updateUserFieldsUseCase.execute(user.id, {
        isTwoFactorEnabled: true,
        recoveryCodes: hashedCodes,
      });

      message =
        '2FA activated successfully. Store your recovery codes securely.';
    }

    const accessToken = this.tokenService.generate2FAToken({
      userId: user.id,
      email: user.email,
      isTwoFactorAuthenticated: true,
      isActive: user.isActive,
    });

    message = message || '2FA verified successfully.';

    return new TwoFAResponseDto(true, accessToken, message, recoveryCodes);
  }
}
