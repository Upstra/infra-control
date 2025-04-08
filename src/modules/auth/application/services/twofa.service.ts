import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { TwoFADto } from '../../dto/twofa.dto';

@Injectable()
export class TwoFactorAuthService {
  generate(email: string) {
    const secret = speakeasy.generateSecret({
      name: `InfraControl (${email})`,
    });
    return qrcode.toDataURL(secret.otpauth_url).then((qr) => ({
      secret: secret.base32,
      qrCode: qr,
    }));
  }

  verify(dto: TwoFADto) {
    return speakeasy.totp.verify({
      secret: dto.secret,
      encoding: 'base32',
      token: dto.code,
    });
  }
}
