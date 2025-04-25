import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseFilters,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { TwoFADto, TwoFAResponseDto } from '../../application/dto/twofa.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFAGuard } from '../guards/twofa.guard';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { Get2FAStatusUseCase } from '../../application/use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../../application/use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../../application/use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../../application/use-cases/disable-2fa.use-case';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly get2FAStatusUseCase: Get2FAStatusUseCase,
    private readonly generate2FAUseCase: Generate2FAUseCase,
    private readonly verify2FAUseCase: Verify2FAUseCase,
    private readonly disable2FAUseCase: Disable2FAUseCase,
  ) {}

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
    return this.loginUseCase.execute(dto);
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
    return this.registerUseCase.execute(dto);
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
    return this.generate2FAUseCase.execute(user.email);
  }

  @Post('2fa/verify')
  @ApiOperation({
    summary: 'Vérifier un code 2FA',
    description:
      'Vérifie le code fourni par l’utilisateur pour activer ou valider le 2FA.',
  })
  @ApiResponse({
    status: 401,
    description: 'Échec de la vérification du code 2FA',
    type: TwoFAResponseDto,
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
    return this.verify2FAUseCase.execute(user, dto);
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
  disable(@CurrentUser() user: JwtPayload, @Body() dto: TwoFADto) {
    return this.disable2FAUseCase.execute(user, dto);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  get2FAStatus(@CurrentUser() user: JwtPayload) {
    return this.get2FAStatusUseCase.execute(user.email);
  }
}
