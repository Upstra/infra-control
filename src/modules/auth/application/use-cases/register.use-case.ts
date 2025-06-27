import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';
import { TokenService } from '../services/token.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RegisterDto) {
    const user = await this.registerUserUseCase.execute(dto);
    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
  }
}
