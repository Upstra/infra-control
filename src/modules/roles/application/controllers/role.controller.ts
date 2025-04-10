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
import { RoleService } from '../services/role.service';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleEndpointInterface } from '../interfaces/role.endpoint.interface';
import { RoleCreationDto } from '../dto/role.creation.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Role')
@Controller('role')
export class RoleController implements RoleEndpointInterface {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les rôles',
    description:
      'Renvoie la liste complète des rôles disponibles dans le système.',
  })
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return this.roleService.getAllRoles();
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
    return this.roleService.getRoleById(id);
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
    return this.roleService.createRole(roleDto);
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
    return this.roleService.updateRole(id, roleDto);
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
    return this.roleService.deleteRole(id);
  }
}
