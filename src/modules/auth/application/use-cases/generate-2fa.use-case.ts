import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UserService } from '@/modules/users/application/services/user.service';
import { TwoFaGenerateQrCodeResponseDto } from '../dto/twofa.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';

@Injectable()
export class Generate2FAUseCase {
  constructor(private readonly userService: UserService) {}

  async execute(email: string): Promise<TwoFaGenerateQrCodeResponseDto> {
    const user = await this.userService.findRawByEmail(email);
    if (!user) throw new UserNotFoundException();

    const secret = speakeasy.generateSecret({
      name: `InfraControl (${email})`,
    });

    await this.userService.updateUserFields(user.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: secret.base32,
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return new TwoFaGenerateQrCodeResponseDto(secret.base32, qrCode);
  }
}
