import {
  Controller,
  Post,
  Body,
  UseFilters,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiBody, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordWithTokenDto } from '../dto/reset-password-with-token.dto';

import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { RenewTokenUseCase } from '../use-cases/renew-token.use-case';
import { ForgotPasswordUseCase } from '../use-cases/forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from '../use-cases/reset-password-with-token.use-case';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { LoginResponseDto } from '../dto';
import { AuthRateLimitGuard } from '@/core/guards/rate-limit.guard';
import { RequestContextDto } from '@/core/dto';
import { PasswordResetRateLimitGuard } from '@/core/guards/password-reset-rate-limit.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly renewTokenUseCase: RenewTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordWithTokenUseCase: ResetPasswordWithTokenUseCase,
  ) {}

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
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
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: LoginResponseDto,
  })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const requestContext = RequestContextDto.fromRequest(req);

    return this.loginUseCase.execute(dto, requestContext).then((response) => {
      if (response.requiresTwoFactor) {
        return response;
      }

      res.cookie('refreshToken', response.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh',
      });
      return { accessToken: response.accessToken };
    });
  }

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Inscription d’un nouvel utilisateur',
    description: 'Crée un nouvel utilisateur...',
  })
  @ApiBody({ type: RegisterDto, description: 'Register DTO', required: true })
  @ApiResponse({
    status: 201,
    description: 'Inscription réussie',
    type: LoginResponseDto,
  })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const requestContext = RequestContextDto.fromRequest(req);

    return this.registerUseCase
      .execute(dto, requestContext)
      .then(({ accessToken, refreshToken }) => {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/auth/refresh',
        });
        return { accessToken };
      });
  }

  @Post('refresh')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Renouveler le JWT',
    description:
      'Renvoie un nouvel access token à partir du refresh token (dans cookie httpOnly)',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.renewTokenUseCase.execute(refreshToken);
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    return { accessToken };
  }

  @Post('logout')
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { message: 'Déconnexion réussie' };
  }

  @Post('forgot-password')
  @UseGuards(PasswordResetRateLimitGuard)
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Demande de réinitialisation de mot de passe',
    description:
      "Envoie un email avec un lien de réinitialisation si l'adresse email existe",
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: "Email de l'utilisateur",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Email envoyé si l'adresse existe",
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto.email);
  }

  @Post('reset-password')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiOperation({
    summary: 'Réinitialisation du mot de passe avec token',
    description:
      'Réinitialise le mot de passe avec un token valide reçu par email',
  })
  @ApiBody({
    type: ResetPasswordWithTokenDto,
    description: 'Token et nouveau mot de passe',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Token invalide ou expiré',
  })
  resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    return this.resetPasswordWithTokenUseCase.execute(
      dto.token,
      dto.newPassword,
    );
  }
}
