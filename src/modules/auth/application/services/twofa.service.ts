import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { TwoFADisableResponseDto, TwoFADto, TwoFAResponseDto } from '../../dto/twofa.dto';
import { UserService } from '@/modules/users/application/services/user.service';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TwoFactorAuthService {
  constructor(private readonly userService: UserService, private readonly jwtService: JwtService) { }
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
    userJwtPayload: JwtPayload,
    dto: TwoFADto,
  ) {
    const user = await this.userService.findRawByEmail(userJwtPayload.email);
    if (!user) throw new Error('User not found');

    const isValid: boolean = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!isValid) return new TwoFAResponseDto(isValid, null);

    if (!user.isTwoFactorEnabled) {
      await this.userService.updateUserFields(user.id, {
        isTwoFactorEnabled: true,
      });
    }

    const accessToken = this.jwtService.sign({ userId: user.id, email: user.email });

    return new TwoFAResponseDto(isValid, accessToken);
  }

  async disable(user: JwtPayload, dto: TwoFADto): Promise<TwoFADisableResponseDto> {
    const userRaw = await this.userService.findRawByEmail(user.email);
    if (!userRaw) throw new Error('User not found');

    const isValid: boolean = speakeasy.totp.verify({
      secret: userRaw.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!isValid) return new TwoFADisableResponseDto(false);

    await this.userService.updateUserFields(userRaw.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return new TwoFADisableResponseDto(true);
  }

}