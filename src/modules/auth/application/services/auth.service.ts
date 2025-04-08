import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../dto/login.dto';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/users/application/services/user.service';
import { RegisterDto } from '../../dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
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
    await this.userService.assertUsernameAndEmailAvailable(
      dto.username,
      dto.email,
    );

    const role: RoleResponseDto = await this.roleService.ensureDefaultRole();

    const user = await this.userDomain.createUser(
      dto.username,
      dto.password,
      dto.email,
      uuidv4().toString(),
      dto.firstName,
      dto.lastName,
    );

    const saved = await this.userService.createUser(user);

    const token = this.jwtService.sign({ userId: saved.id });
    return { accessToken: token };
  }
}
