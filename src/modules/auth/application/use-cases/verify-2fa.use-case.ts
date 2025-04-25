import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADto, TwoFAResponseDto } from '../dto/twofa.dto';
import { TwoFAInvalidCodeException } from '../../domain/exceptions/twofa.exception';

import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.exception';

@Injectable()
export class Verify2FAUseCase {
  constructor(
    private readonly findUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly updateUserFieldsUseCase: UpdateUserFieldsUseCase,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    userJwtPayload: JwtPayload,
    dto: TwoFADto,
  ): Promise<TwoFAResponseDto> {
    const user = await this.findUserByEmailUseCase.execute(
      userJwtPayload.email,
    );
    if (!user) throw new UserNotFoundException(userJwtPayload.email);

    const isValid: boolean = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!isValid) throw new TwoFAInvalidCodeException();

    if (!user.isTwoFactorEnabled) {
      await this.updateUserFieldsUseCase.execute(user.id, {
        isTwoFactorEnabled: true,
      });
    }

    const accessToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    return new TwoFAResponseDto(true, accessToken);
  }
}
