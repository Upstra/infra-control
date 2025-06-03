import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../dto/register.dto';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto) {
    const user = await this.registerUserUseCase.execute(dto);
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
    return { accessToken: token };
  }
}
