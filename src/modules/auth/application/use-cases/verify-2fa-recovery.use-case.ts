import { ForbiddenException, Injectable } from '@nestjs/common';

import { JwtPayload } from '@/core/types/jwt-payload.interface';

import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';
import { TwoFARecoveryDto, TwoFAResponseDto } from '../dto/twofa.dto';

@Injectable()
export class Verify2FARecoveryUseCase {
  constructor(
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly updateUserFieldsUseCase: UpdateUserFieldsUseCase,
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

    return new TwoFAResponseDto(
      true,
      null,
      'Connexion via recovery code réussie.',
    );
  }
}
