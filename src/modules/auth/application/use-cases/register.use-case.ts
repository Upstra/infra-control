import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { UserService } from '../../../users/application/services/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async execute(dto: RegisterDto) {
    const user = await this.userService.registerWithDefaultRole(dto);
    const token = this.jwtService.sign({ userId: user.id });
    return { accessToken: token };
  }
}
