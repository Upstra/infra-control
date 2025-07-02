// 📁 src/modules/auth/application/use-cases/get-2fa-status.use-case.ts
import { Injectable } from '@nestjs/common';
import { GetUserByEmailUseCase } from '@/modules/users/application/use-cases';

/**
 * Retrieves a user’s current two-factor authentication (2FA) status.
 *
 * Responsibilities:
 * - Looks up the user by email via GetUserByEmailUseCase.
 * - Returns a boolean indicating if 2FA is enabled.
 *
 * @param email  The email address of the user to check.
 * @returns      An object { isTwoFactorEnabled: boolean }.
 *
 * @example
 * const status = await get2FAStatusUseCase.execute('user@example.com');
 */

@Injectable()
export class Get2FAStatusUseCase {
  constructor(private readonly findUserByEmail: GetUserByEmailUseCase) {}

  async execute(email: string): Promise<{ isTwoFactorEnabled: boolean }> {
    const user = await this.findUserByEmail.execute(email);
    return { isTwoFactorEnabled: !!user?.isTwoFactorEnabled };
  }
}
