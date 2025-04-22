import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { UserService } from '../../../users/application/services/user.service';
import { UserDomainService } from '../../../users/domain/services/user.domain.service';
import {
  AuthNotFoundException,
  AuthPasswordNotValidException,
} from '../../domain/exceptions/auth.exception';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly userDomain: UserDomainService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto) {
    const { identifier, password } = dto;
    const isEmail =
      identifier.includes('@') && identifier.split('@').length === 2;

    const user = isEmail
      ? await this.userService.findRawByEmail(identifier)
      : await this.userService.findRawByUsername(identifier);

    if (!user) throw new AuthNotFoundException();

    const isValidPassword = await this.userDomain.validatePassword(
      user.password,
      password,
    );
    if (!isValidPassword) throw new AuthPasswordNotValidException();

    if (this.userDomain.isTwoFactorEnabled(user)) {
      const tempToken = this.jwtService.sign(
        {
          userId: user.id,
          step: '2fa',
          email: user.email,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        { expiresIn: '5m' },
      );

      return {
        requiresTwoFactor: true,
        twoFactorToken: tempToken,
      };
    }

    const finalToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });

    return { accessToken: finalToken };
  }
}
