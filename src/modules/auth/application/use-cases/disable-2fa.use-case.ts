// 📁 src/modules/auth/application/use-cases/disable-2fa.use-case.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADisableResponseDto, TwoFADto } from '../dto/twofa.dto';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

@Injectable()
export class Disable2FAUseCase {
  constructor(
    private readonly findUserByEmail: GetUserByEmailUseCase,
    private readonly updateUserFields: UpdateUserFieldsUseCase,
  ) {}

  async execute(
    user: JwtPayload,
    dto: TwoFADto,
  ): Promise<TwoFADisableResponseDto> {
    const userRaw = await this.findUserByEmail.execute(user.email);

    const isValid: boolean = speakeasy.totp.verify({
      secret: userRaw.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!isValid) return new TwoFADisableResponseDto(false);

    await this.updateUserFields.execute(userRaw.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return new TwoFADisableResponseDto(true);
  }
}
