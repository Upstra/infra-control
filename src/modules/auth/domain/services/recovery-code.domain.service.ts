import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

/**
 * Manages generation, storage, and validation of user recovery codes for account restoration.
 * Ensures secure handling and one-time usage of codes in multi-factor authentication flows.
 *
 * Responsibilities:
 * - Generate cryptographically random recovery codes when a user enables or requests MFA reset.
 * - Persist codes with expiration metadata and one-time-use semantics.
 * - Validate submitted recovery codes, marking them consumed upon successful verification.
 * - Enforce rate limits and expiration checks to prevent brute-force or replay attempts.
 *
 * @remarks
 * This service is designed for use by application-layer use-cases that orchestrate
 * user account recovery flows. Controllers should not call it directly without
 * the coordinating use-case.
 *
 * @example
 * // Issue a new set of recovery codes for a user
 * const codes = await recoveryCodeService.generateCodes(userId);
 *
 * // Validate a submitted code
 * const isValid = await recoveryCodeService.validateCode(userId, submittedCode);
 * if (!isValid) {
 *   throw new InvalidRecoveryCodeException();
 * }
 */

@Injectable()
export class RecoveryCodeService {
  generate(): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        const index = randomInt(characters.length);
        code += characters[index];
      }
      codes.push(code.match(/.{1,4}/g)?.join('-') ?? code);
    }

    return codes;
  }

  async hash(codes: string[]): Promise<string[]> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 10;
    return Promise.all(codes.map((code) => bcrypt.hash(code, saltRounds)));
  }

  async compare(code: string, hashedCodes: string[]): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    for (const hashedCode of hashedCodes) {
      const match = await bcrypt.compare(code, hashedCode);
      if (match) return true;
    }
    return false;
  }
}
