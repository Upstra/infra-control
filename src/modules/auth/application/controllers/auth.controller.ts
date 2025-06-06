import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
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
}
