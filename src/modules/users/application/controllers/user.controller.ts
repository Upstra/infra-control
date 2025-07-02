import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

import { UserResponseDto } from '../dto/user.response.dto';
import { UserListResponseDto } from '../dto/user.list.response.dto';

import { UserUpdateDto } from '../dto/user.update.dto';

import {
  GetMeUseCase,
  GetUserByIdUseCase,
  GetUserCountUseCase,
  GetUserListUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  ResetPasswordUseCase,
} from '../use-cases';
import { ResetPasswordDto } from '../dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserListUseCase: GetUserListUseCase,
    private readonly getUserCountUseCase: GetUserCountUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
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
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.getMeUseCase.execute(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Récupérer la liste paginée des utilisateurs' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  async getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<UserListResponseDto> {
    return this.getUserListUseCase.execute(Number(page), Number(limit));
  }

  /**
   * Get total count of users.
   */
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Nombre total d'utilisateurs" })
  @ApiResponse({ status: 200, type: Number })
  async getUserCount(): Promise<number> {
    return this.getUserCountUseCase.execute();
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
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.getUserByIdUseCase.execute(id);
  }

  @Patch('update-account/:id')
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
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UserUpdateDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(id, updateUserDto, user.userId);
  }

  @Patch('me/update-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: UserUpdateDto })
  @ApiOperation({
    summary: 'Mettre à jour son propre compte',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UserUpdateDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(user.userId, updateUserDto);
  }

  @Patch('me/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: ResetPasswordDto })
  @ApiOperation({
    summary: 'Réinitialiser son propre mot de passe',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async resetCurrentUserPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ResetPasswordDto,
  ): Promise<UserResponseDto> {
    return this.resetPasswordUseCase.execute(user.userId, dto);
  }

  @Patch(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOperation({ summary: 'Réinitialiser le mot de passe (admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<UserResponseDto> {
    return this.resetPasswordUseCase.execute(id, dto);
  }

  @Delete('/me/delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Supprime l'utilisateur courant",
    description:
      "Supprime l'utilisateur courant via son token JWT. Action Irréversible",
  })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé avec succès' })
  async deleteCurrentUser(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.deleteUserUseCase.execute(user.userId);
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
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé avec succès' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
