import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  RoleCreationDto,
  RoleResponseDto,
} from '@/modules/roles/application/dto/index';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  UpdateRoleUseCase,
} from '@/modules/roles/application/use-cases';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les rôles',
    description:
      'Renvoie la liste complète des rôles disponibles dans le système.',
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
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteRoleUseCase.execute(id);
  }
}
