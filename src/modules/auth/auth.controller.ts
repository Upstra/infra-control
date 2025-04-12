import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { TwoFactorAuthService } from './application/services/twofa.service';
import { LoginDto } from './dto/login.dto';
import { TwoFADto } from './dto/twofa.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UseFilters } from '@nestjs/common';
import { InvalidQueryExceptionFilter } from '@/core/exceptions/repository.exception';
import { TwoFAGuard } from './guards/twofa.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFAService: TwoFactorAuthService,
  ) { }

  @Post('login')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Connexion d’un utilisateur',
    description:
      'Permet à un utilisateur de se connecter avec son email et son mot de passe. Retourne un JWT.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login DTO',
    required: true,
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Inscription d’un nouvel utilisateur',
    description:
      'Crée un nouvel utilisateur avec les informations fournies dans le RegisterDto.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Register DTO',
    required: true,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('2fa/generate')
  @ApiOperation({
    summary: 'Générer un QR Code pour le 2FA',
    description:
      'Génère un QR Code pour configurer la double authentification via une application type Google Authenticator.',
  })
  @UseGuards(JwtAuthGuard, TwoFAGuard)
  @ApiBearerAuth()
  @UseFilters(InvalidQueryExceptionFilter)
  generate(@CurrentUser() user: JwtPayload) {
    return this.twoFAService.generate(user.email);
  }

  @Post('2fa/verify')
  @ApiOperation({
    summary: 'Vérifier un code 2FA',
    description:
      'Vérifie le code fourni par l’utilisateur pour activer ou valider le 2FA.',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: TwoFADto,
    description: '2FA verification DTO',
    required: true,
  })
  verify(@CurrentUser() user: JwtPayload, @Body() dto: TwoFADto) {
    return this.twoFAService.verify(user, dto);
  }

  @Post('2fa/disable')
  @ApiOperation({
    summary: 'Désactiver le 2FA',
    description:
      'Désactive la double authentification pour l’utilisateur connecté après vérification.',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: TwoFADto,
    description: '2FA disable DTO',
    required: true,
  })
  disable(@Req() user: JwtPayload, @Body() dto: TwoFADto) {
    return this.twoFAService.disable(user, dto);
  }
}
