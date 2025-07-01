import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import {
  RoleCreationDto,
  RoleListResponseDto,
  RoleResponseDto,
} from '@/modules/roles/application/dto';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  GetRoleListUseCase,
  UpdateRoleUseCase,
  GetUsersByRoleUseCase,
  UpdateUserRoleUseCase,
} from '@/modules/roles/application/use-cases';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getRoleListUseCase: GetRoleListUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly getUsersByRoleUseCase: GetUsersByRoleUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Récupérer la liste paginée des rôles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles paginée',
    type: RoleListResponseDto,
  })
  async getRoles(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<RoleListResponseDto> {
    return this.getRoleListUseCase.execute(Number(page), Number(limit));
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer tous les rôles',
    description:
      'Renvoie la liste de tous les rôles disponibles dans le système, sans pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les rôles',
    type: [RoleResponseDto],
  })
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return this.getAllRolesUseCase.execute();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du rôle à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un rôle par son ID',
    description:
      'Renvoie les informations d’un rôle spécifique identifié par son UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du rôle',
    type: RoleResponseDto,
  })
  async getRoleById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleResponseDto> {
    return this.getRoleByIdUseCase.execute(id);
  }

  @Post()
  @ApiBody({
    type: RoleCreationDto,
    description: 'Données nécessaires à la création d’un nouveau rôle',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer un nouveau rôle',
    description:
      'Crée un rôle avec les données spécifiées dans le `RoleCreationDto`.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rôle créé avec succès',
    type: RoleResponseDto,
  })
  async createRole(@Body() roleDto: RoleCreationDto): Promise<RoleResponseDto> {
    return this.createRoleUseCase.execute(roleDto);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du rôle à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: RoleCreationDto,
    description: 'Données nécessaires pour mettre à jour un rôle existant',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un rôle',
    description:
      'Met à jour un rôle existant à partir de son UUID et des nouvelles données.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour avec succès',
    type: RoleResponseDto,
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleDto: RoleCreationDto,
  ): Promise<RoleResponseDto> {
    return this.updateRoleUseCase.execute(id, roleDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du rôle à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un rôle',
    description:
      'Supprime un rôle spécifique selon son UUID. Action irréversible.',
  })
  @ApiResponse({
    status: 204,
    description: 'Rôle supprimé avec succès',
  })
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteRoleUseCase.execute(id);
  }

  @Get(':id/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: "Liste des utilisateurs d'un rôle" })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async getUsersByRole(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto[]> {
    return this.getUsersByRoleUseCase.execute(id);
  }

  @Patch('user/update-account/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      properties: {
        roleId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @ApiOperation({ summary: "Mettre à jour le rôle d'un utilisateur" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('roleId') roleId: string | null,
  ): Promise<UserResponseDto> {
    return this.updateUserRoleUseCase.execute(id, roleId);
  }
}
