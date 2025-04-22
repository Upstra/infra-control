import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserService } from '@/modules/users/application/services/user.service';
import { TwoFADisableResponseDto, TwoFADto } from '../dto/twofa.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';

@Injectable()
export class Disable2FAUseCase {
  constructor(private readonly userService: UserService) { }

  async execute(
    user: JwtPayload,
    dto: TwoFADto,
  ): Promise<TwoFADisableResponseDto> {
    const userRaw = await this.userService.findRawByEmail(user.email);
    if (!userRaw) throw new UserNotFoundException();

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
