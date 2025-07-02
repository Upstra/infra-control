import { Injectable } from '@nestjs/common';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADisableResponseDto } from '../dto/twofa.dto';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

/**
 * Disables two-factor authentication for a user account.
 *
 * Responsibilities:
 * - Retrieves user by email via GetUserByEmailUseCase.
 * - If 2FA is not enabled, returns false without changes.
 * - Otherwise, clears 2FA fields (secret and recovery codes) and updates the user.
 *
 * @param user  JwtPayload of the authenticated user.
 * @returns     TwoFADisableResponseDto indicating prior and new 2FA status.
 *
 * @example
 * const result = await disable2FAUseCase.execute(jwtPayload);
 */

@Injectable()
export class Disable2FAUseCase {
  constructor(
    private readonly findUserByEmail: GetUserByEmailUseCase,
    private readonly updateUserFields: UpdateUserFieldsUseCase,
  ) {}

  async execute(user: JwtPayload): Promise<TwoFADisableResponseDto> {
    const userRaw = await this.findUserByEmail.execute(user.email);

    if (userRaw.isTwoFactorEnabled === false) {
      return new TwoFADisableResponseDto(false);
    }

    await this.updateUserFields.execute(userRaw.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: null,
    });

    return new TwoFADisableResponseDto(true);
  }
}
