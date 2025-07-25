import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseFilters,
  Get,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TwoFADto, TwoFARecoveryDto, TwoFAResponseDto } from '../dto/twofa.dto';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard';
import { TwoFAGuard } from '../../infrastructure/guards/twofa.guard';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

import { Get2FAStatusUseCase } from '../use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../use-cases/disable-2fa.use-case';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { Verify2FARecoveryUseCase } from '../use-cases';
import { AuthRateLimitGuard } from '@/core/guards/rate-limit.guard';

@ApiTags('2FA')
@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
@UseFilters(InvalidQueryExceptionFilter)
@ApiBearerAuth()
export class TwoFAController {
  constructor(
    private readonly generate2FAUseCase: Generate2FAUseCase,
    private readonly verify2FAUseCase: Verify2FAUseCase,
    private readonly disable2FAUseCase: Disable2FAUseCase,
    private readonly get2FAStatusUseCase: Get2FAStatusUseCase,
    private readonly verify2FARecoveryUseCase: Verify2FARecoveryUseCase,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Générer un QR Code pour le 2FA',
    description:
      'Génère un QR Code pour configurer la double authentification via une application type Google Authenticator.',
  })
  @UseGuards(JwtAuthGuard, TwoFAGuard)
  @ApiBearerAuth()
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiResponse({ status: 200, description: 'QR Code généré.' })
  generate(@CurrentUser() user: JwtPayload) {
    return this.generate2FAUseCase.execute(user.email);
  }

  @Post('verify')
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
  @UseGuards(AuthRateLimitGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: TwoFADto,
    description: '2FA verification DTO',
    required: true,
  })
  @ApiResponse({ status: 200, type: TwoFAResponseDto })
  async verify(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TwoFADto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.verify2FAUseCase.execute(user, dto);
    
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    return result;
  }

  @Post('disable')
  @ApiOperation({
    summary: 'Désactiver le 2FA',
    description:
      'Désactive la double authentification pour l’utilisateur connecté après vérification.',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '2FA désactivé' })
  disable(@CurrentUser() user: JwtPayload) {
    return this.disable2FAUseCase.execute(user);
  }

  @Post('recovery')
  @ApiOperation({
    summary: 'Connexion via un code de récupération 2FA',
    description:
      'Permet de se connecter si le téléphone 2FA est perdu, en utilisant un recovery code.',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: TwoFARecoveryDto })
  @ApiResponse({ status: 200, type: TwoFAResponseDto })
  async recover(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TwoFARecoveryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.verify2FARecoveryUseCase.execute(user, dto);
    
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    return result;
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  get2FAStatus(@CurrentUser() user: JwtPayload) {
    return this.get2FAStatusUseCase.execute(user.email);
  }
}
