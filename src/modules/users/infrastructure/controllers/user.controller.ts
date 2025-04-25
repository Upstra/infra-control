import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

import { UserResponseDto } from '../../application/dto/user.response.dto';
import { UserUpdateDto } from '../../application/dto/user.update.dto';

import {
  GetMeUseCase,
  GetUserByIdUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from '../../application/use-cases';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer son propre profil utilisateur',
    description:
      'Renvoie les informations du profil utilisateur connecté via le JWT.',
  })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.getMeUseCase.execute(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à récupérer",
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un utilisateur par son ID',
    description: "Renvoie les informations de l'utilisateur par son UUID.",
  })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.getUserByIdUseCase.execute(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à mettre à jour",
    required: true,
  })
  @ApiBody({
    type: UserUpdateDto,
    description: 'Données nécessaires pour mettre à jour un utilisateur',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description: 'Modifie un utilisateur existant en fonction de son UUID.',
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UserUpdateDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à supprimer",
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description: 'Supprime un utilisateur via son UUID. Action irréversible.',
  })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
