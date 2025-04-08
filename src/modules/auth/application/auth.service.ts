import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/users/application/user.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userDomain: UserDomainService,
    private readonly jwtService: JwtService,
  ) { }

  async login(dto: LoginDto) {
    const user = await this.userService.findRawByUsername(dto.username);
    if (!user) throw new UnauthorizedException('User not found');

    const isValidPassword = await this.userDomain.validatePassword(
      user,
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
    await this.userService.assertUsernameAndEmailAvailable(dto.username, dto.email);
    const defaultRoleId = await this.userService.getDefaultRoleId();

    const user = this.userDomain.createUser(
      dto.username,
      dto.password,
      dto.email,
      defaultRoleId,
    );

    const saved = await this.userService.createUser(user);

    const token = this.jwtService.sign({ userId: saved.id });
    return { accessToken: token };
  }



}
