import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/users/application/services/user.service';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADto, TwoFAResponseDto } from '../dto/twofa.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';
import { TwoFAInvalidCodeException } from '../../domain/exceptions/twofa.exception';

@Injectable()
export class Verify2FAUseCase {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async execute(
        userJwtPayload: JwtPayload,
        dto: TwoFADto,
    ): Promise<TwoFAResponseDto> {
        const user = await this.userService.findRawByEmail(userJwtPayload.email);
        if (!user) throw new UserNotFoundException();

        const isValid: boolean = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: dto.code,
        });

        if (!isValid) throw new TwoFAInvalidCodeException();

        if (!user.isTwoFactorEnabled) {
            await this.userService.updateUserFields(user.id, {
                isTwoFactorEnabled: true,
            });
        }

        const accessToken = this.jwtService.sign({
            userId: user.id,
            email: user.email,
        });

        return new TwoFAResponseDto(isValid, accessToken);
    }
}
