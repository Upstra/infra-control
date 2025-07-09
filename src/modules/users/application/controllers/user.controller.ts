import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
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
import { RequestContextDto } from '@/core/dto';

import { UserResponseDto } from '../dto/user.response.dto';
import { UserListResponseDto } from '../dto/user.list.response.dto';
import { UserCreateDto } from '../dto/user.create.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { BulkActivateDto } from '../dto/bulk-activate.dto';

import {
  GetMeUseCase,
  GetUserByIdUseCase,
  GetUserCountUseCase,
  GetUserListUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  ResetPasswordUseCase,
  SoftDeleteUserUseCase,
  ToggleUserStatusUseCase,
  UpdateAccountUseCase,
  BulkActivateUseCase,
  CreateUserByAdminUseCase,
} from '../use-cases';
import { ResetPasswordDto } from '../dto';
import {
  DeleteAccountDto,
  DeleteAccountResponseDto,
} from '../dto/delete-account.dto';
import { RequireRole } from '@/core/decorators/role.decorator';
import { RoleGuard } from '@/core/guards/role.guard';

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
    private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
    private readonly toggleUserStatusUseCase: ToggleUserStatusUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly bulkActivateUseCase: BulkActivateUseCase,
    private readonly createUserByAdminUseCase: CreateUserByAdminUseCase,
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
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.updateUserUseCase.execute(
      id,
      updateUserDto,
      user.userId,
      requestContext,
    );
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
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.updateUserUseCase.execute(
      user.userId,
      updateUserDto,
      user.userId,
      requestContext,
    );
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
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.resetPasswordUseCase.execute(user.userId, dto, requestContext);
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
    @CurrentUser() admin: JwtPayload,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.resetPasswordUseCase.execute(
      id,
      dto,
      requestContext,
      admin.userId,
    );
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

  @Patch(':id/delete-account')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à supprimer (soft delete)",
    required: true,
  })
  @ApiBody({
    type: DeleteAccountDto,
    description: 'Données optionnelles pour la suppression',
    required: false,
  })
  @ApiOperation({
    summary: 'Supprimer un compte utilisateur (soft delete)',
    description:
      'Effectue une suppression logique du compte utilisateur. Admin uniquement.',
  })
  @ApiResponse({
    status: 200,
    type: DeleteAccountResponseDto,
    description: 'Compte utilisateur supprimé avec succès',
  })
  async deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteAccountDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: any,
  ): Promise<DeleteAccountResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);

    await this.softDeleteUserUseCase.execute(
      id,
      admin.userId,
      dto.reason,
      dto.details,
      requestContext.ipAddress,
      requestContext.userAgent,
    );

    return {
      success: true,
      message: 'User account has been deleted',
    };
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à activer/désactiver",
    required: true,
  })
  @ApiBody({
    type: Object,
    description: 'Body optionnel',
    required: false,
  })
  @ApiOperation({
    summary: 'Activer/Désactiver un utilisateur',
    description:
      "Change le statut actif/inactif d'un utilisateur. Admin uniquement.",
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Statut utilisateur modifié avec succès',
  })
  async toggleUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);

    return this.toggleUserStatusUseCase.execute({
      targetUserId: id,
      adminId: admin.userId,
      requestContext: {
        ip: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      },
    });
  }

  @Patch(':id/update-account')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: "UUID de l'utilisateur à mettre à jour",
    required: true,
  })
  @ApiBody({
    type: UpdateAccountDto,
    description: 'Données pour mettre à jour le compte utilisateur',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un compte utilisateur (admin)',
    description:
      "Permet à un administrateur de mettre à jour les informations d'un compte utilisateur.",
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Compte utilisateur mis à jour avec succès',
  })
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<UserResponseDto> {
    return this.updateAccountUseCase.execute(id, updateAccountDto);
  }

  @Patch('bulk-activate')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiBody({
    type: BulkActivateDto,
    description: 'Liste des IDs utilisateurs à activer',
    required: true,
  })
  @ApiOperation({
    summary: 'Activer plusieurs utilisateurs (admin)',
    description:
      "Permet à un administrateur d'activer plusieurs utilisateurs en une seule opération.",
  })
  @ApiResponse({
    status: 200,
    type: [UserResponseDto],
    description: 'Utilisateurs activés avec succès',
  })
  async bulkActivateUsers(
    @Body() bulkActivateDto: BulkActivateDto,
  ): Promise<UserResponseDto[]> {
    return this.bulkActivateUseCase.execute(bulkActivateDto);
  }

  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiBody({
    type: UserCreateDto,
    description: 'Données pour créer un nouvel utilisateur',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur (admin)',
    description:
      'Permet à un administrateur de créer un nouvel utilisateur avec des rôles spécifiques.',
  })
  @ApiResponse({
    status: 201,
    type: UserResponseDto,
    description: 'Utilisateur créé avec succès',
  })
  @ApiResponse({
    status: 409,
    description: 'Username ou email déjà existant',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async createUser(
    @Body() createUserDto: UserCreateDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserResponseDto> {
    const user = await this.createUserByAdminUseCase.execute(
      createUserDto,
      admin.userId,
    );
    return UserResponseDto.fromEntity(user);
  }
}
