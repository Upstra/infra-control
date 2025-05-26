import { Injectable } from '@nestjs/common';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADisableResponseDto } from '../dto/twofa.dto';
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

  async execute(user: JwtPayload): Promise<TwoFADisableResponseDto> {
    const userRaw = await this.findUserByEmail.execute(user.email);

    if (userRaw.isTwoFactorEnabled === false) {
      return new TwoFADisableResponseDto(false);
    }

    await this.updateUserFields.execute(userRaw.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: null,
    });

    return new TwoFADisableResponseDto(true);
  }
}
