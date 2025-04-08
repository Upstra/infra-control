import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './application/auth.service';
import { TwoFactorAuthService } from './application/twofa.service';
import { LoginDto } from './dto/login.dto';
import { TwoFADto } from './dto/twofa.dto';
import { ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFAService: TwoFactorAuthService,
  ) { }

  @Post('login')
  @ApiBody({
    type: LoginDto,
    description: 'Login DTO',
    required: true,
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiBody({
    type: RegisterDto,
    description: 'Register DTO',
    required: true,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('2fa/generate')
  @ApiBody({
    type: String,
    description: 'Email address to generate 2FA code for',
    required: true,
  })
  generate(@Body('email') email: string) {
    return this.twoFAService.generate(email);
  }

  @Post('2fa/verify')
  @ApiBody({
    type: TwoFADto,
    description: '2FA verification DTO',
    required: true,
  })
  verify(@Body() dto: TwoFADto) {
    return this.twoFAService.verify(dto);
  }
}
