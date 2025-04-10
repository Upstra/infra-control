import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../dto/login.dto';
import { UserDomainService } from '../../../users/domain/services/user.domain.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../users/application/services/user.service';
import { RegisterDto } from '../../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userDomain: UserDomainService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findRawByUsername(dto.username);

    const isValidPassword = await this.userDomain.validatePassword(
      user.password,
      dto.password,
    );

    if (!isValidPassword)
      throw new UnauthorizedException('Invalid credentials');

    if (this.userDomain.isTwoFactorEnabled(user)) {
      const tempToken = this.jwtService.sign(
        { userId: user.id, step: '2fa' },
        { expiresIn: '5m' },
      );

      return {
        requiresTwoFactor: true,
        twoFactorToken: tempToken,
      };
    }

    const finalToken = this.jwtService.sign({ userId: user.id });
    return { accessToken: finalToken };
  }

  async register(dto: RegisterDto) {
    const user = await this.userService.registerWithDefaultRole(dto);
    const token = this.jwtService.sign({ userId: user.id });
    return { accessToken: token };
  }
}
