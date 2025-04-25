// 📁 src/modules/auth/application/use-cases/generate-2fa.use-case.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { TwoFaGenerateQrCodeResponseDto } from '../dto/twofa.dto';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

@Injectable()
export class Generate2FAUseCase {
  constructor(
    private readonly findUserByEmail: GetUserByEmailUseCase,
    private readonly updateUserFields: UpdateUserFieldsUseCase,
  ) {}

  async execute(email: string): Promise<TwoFaGenerateQrCodeResponseDto> {
    const user = await this.findUserByEmail.execute(email);

    const secret = speakeasy.generateSecret({
      name: `InfraControl (${email})`,
    });

    await this.updateUserFields.execute(user.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: secret.base32,
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return new TwoFaGenerateQrCodeResponseDto(secret.base32, qrCode);
  }
}
