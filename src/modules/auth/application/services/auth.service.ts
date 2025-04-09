import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../dto/login.dto';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/users/application/services/user.service';
import { RegisterDto } from '../../dto/register.dto';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { RoleService } from '@/modules/roles/application/services/role.service';
import { RoleResponseDto } from '@/modules/roles/application/dto/role.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userDomain: UserDomainService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
  ) {}

  async login(dto: LoginDto) {
    const userResponseDto = await this.userService.findByUsername(dto.username);
    const user = userResponseDto.toUser();

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
    const user = await this.userService.registerWithDefaultRole(dto);
    const token = this.jwtService.sign({ userId: user.id });
    return { accessToken: token };
  }
}
