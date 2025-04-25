import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto) {
    const user = await this.registerUserUseCase.execute(dto);
    const token = this.jwtService.sign({ userId: user.id });
    return { accessToken: token };
  }
}
