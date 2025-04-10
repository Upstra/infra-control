import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { TwoFactorAuthService } from './application/services/twofa.service';
import { LoginDto } from './dto/login.dto';
import { TwoFADto } from './dto/twofa.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFAService: TwoFactorAuthService,
  ) {}

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generate(@Req() req) {
    return this.twoFAService.generate(req.user.email);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: TwoFADto,
    description: '2FA verification DTO',
    required: true,
  })
  verify(@Req() req, @Body() dto: TwoFADto) {
    return this.twoFAService.verify(req.user, dto);
  }
}
