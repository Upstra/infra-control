import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseFilters,
  Req,
} from '@nestjs/common';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmListResponseDto } from '../dto/vm.list.response.dto';
import { VmEndpointInterface } from '../interfaces/vm.endpoint.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateVmUseCase,
  DeleteVmUseCase,
  GetVmListUseCase,
  GetAllVmsUseCase,
  GetVmByIdUseCase,
  UpdateVmUseCase,
  UpdateVmPriorityUseCase,
} from '@/modules/vms/application/use-cases';
import { UpdatePriorityDto } from '../../../priorities/application/dto/update-priority.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { RequireResourcePermission } from '@/core/decorators/ressource-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RequestContextDto } from '@/core/dto';

@ApiTags('VM')
@Controller('vm')
export class VmController implements VmEndpointInterface {
  constructor(
    private readonly getAllVmsUseCase: GetAllVmsUseCase,
    private readonly getVmListUseCase: GetVmListUseCase,
    private readonly getVmByIdUseCase: GetVmByIdUseCase,
    private readonly createVmUseCase: CreateVmUseCase,
    private readonly updateVmUseCase: UpdateVmUseCase,
    private readonly deleteVmUseCase: DeleteVmUseCase,
    private readonly updateVmPriorityUseCase: UpdateVmPriorityUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Lister les VMs paginées' })
  @ApiResponse({ status: 200, type: VmListResponseDto })
  async getVms(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<VmListResponseDto> {
    return this.getVmListUseCase.execute(Number(page), Number(limit));
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les machines virtuelles' })
  @ApiResponse({ status: 200, type: [VmResponseDto] })
  async getAllVms(): Promise<VmResponseDto[]> {
    return this.getAllVmsUseCase.execute();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer une VM par ID',
    description:
      'Retourne les informations détaillées d’une machine virtuelle en fonction de son identifiant.',
  })
  @ApiResponse({ status: 200, type: VmResponseDto })
  async getVmById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VmResponseDto> {
    return this.getVmByIdUseCase.execute(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'body',
    resourceIdField: 'serverId',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiBody({
    type: VmCreationDto,
    description: "Données nécessaires à la création d'une VM",
    required: true,
  })
  @ApiOperation({
    summary: 'Créer une nouvelle VM',
    description:
      'Crée une machine virtuelle sur un serveur spécifique. Nécessite la permission WRITE sur le serveur hôte.',
  })
  @ApiResponse({ status: 201, type: VmResponseDto })
  async createVm(
    @Body() vmDto: VmCreationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ): Promise<VmResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.createVmUseCase.execute(vmDto, user.userId, requestContext);
  }

  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'vm',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @ApiBearerAuth()
  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à modifier',
    required: true,
  })
  @ApiBody({
    type: VmUpdateDto,
    description: 'Données de mise à jour de la machine virtuelle',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour une VM',
    description:
      'Met à jour les informations d’une machine virtuelle existante.',
  })
  @ApiResponse({ status: 200, type: VmResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  async updateVm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() vmDto: VmUpdateDto,
  ): Promise<VmResponseDto> {
    return this.updateVmUseCase.execute(id, vmDto);
  }

  @Put(':id/priority')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'vm',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la VM',
    required: true,
  })
  @ApiOperation({
    summary: "Mettre à jour la priorité d'une VM",
    description: "Met à jour uniquement la priorité d'une VM",
  })
  @ApiBody({
    type: UpdatePriorityDto,
    description: 'Nouvelle priorité de la VM',
  })
  @ApiResponse({
    status: 200,
    description: 'Priorité mise à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        priority: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  @ApiResponse({
    status: 404,
    description: 'VM non trouvée',
  })
  async updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriorityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ id: string; priority: number }> {
    return this.updateVmPriorityUseCase.execute(id, dto.priority, user.userId);
  }

  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'vm',
    requiredBit: PermissionBit.DELETE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @ApiBearerAuth()
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer une VM',
    description:
      'Supprime une machine virtuelle du système à partir de son identifiant. Action irréversible. Nécessite la permission DELETE sur la VM.',
  })
  @ApiResponse({ status: 204, description: 'VM supprimée avec succès' })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  async deleteVm(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteVmUseCase.execute(id);
  }
}
