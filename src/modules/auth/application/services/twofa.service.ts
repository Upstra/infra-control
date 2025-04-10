import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { TwoFADto, TwoFAResponseDto } from '../../dto/twofa.dto';
import { UserService } from '@/modules/users/application/services/user.service';

@Injectable()
export class TwoFactorAuthService {
  constructor(private readonly userService: UserService) {}
  async generate(email: string) {
    const user = await this.userService.findRawByEmail(email);
    if (!user) throw new Error('User not found');

    const secret = speakeasy.generateSecret({
      name: `InfraControl (${email})`,
    });

    user.twoFactorSecret = secret.base32;
    await this.userService.updateUserSecret(user.id, secret.base32);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verify(
    userJwtPayload: { userId: string; email: string },
    dto: TwoFADto,
  ) {
    const user = await this.userService.findRawByEmail(userJwtPayload.email);
    if (!user) throw new Error('User not found');

    const isValid: boolean = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (isValid) {
      await this.userService.updateUserFields(user.id, {
        isTwoFactorEnabled: true,
      });
    }

    return new TwoFAResponseDto(isValid);
  }
}
