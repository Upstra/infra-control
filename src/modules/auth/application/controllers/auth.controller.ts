import {
  Controller,
  Post,
  Body,
  UseFilters,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiBody, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { RenewTokenUseCase } from '../use-cases/renew-token.use-case';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { LoginResponseDto } from '../dto';
import { AuthRateLimitGuard } from '@/core/guards/rate-limit.guard';
import { RequestContextDto } from '@/core/dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly renewTokenUseCase: RenewTokenUseCase,
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

    return this.loginUseCase
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
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const { accessToken, refreshToken: newRefreshToken } =
      this.renewTokenUseCase.execute(refreshToken);
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
}
