import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import {
  GetAllServersUseCase,
  GetServerByIdUseCase,
  CreateServerUseCase,
  UpdateServerUseCase,
  DeleteServerUseCase,
  GetUserServersUseCase,
  UpdateServerPriorityUseCase,
  CheckServerPermissionUseCase,
  GetServersWithVmsUseCase,
} from '@/modules/servers/application/use-cases';
import { PingServerUseCase } from '@/modules/servers/application/use-cases/ping-server.use-case';

import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerUpdateDto } from '../dto/server.update.dto';
import { ServerListResponseDto } from '../dto/server.list.response.dto';
import { ServerWithVmsResponseDto } from '../dto/server-with-vms.response.dto';
import { UpdatePriorityDto } from '../../../priorities/application/dto/update-priority.dto';
import { CheckServerPermissionDto } from '../dto/check-server-permission.dto';
import { ServerPermissionCheckResponseDto } from '../dto/permission-check.response.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { RequireResourcePermission } from '@/core/decorators/ressource-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { LogToHistory } from '@/core/decorators/logging-context.decorator';
import { RequestContextDto } from '@/core/dto';
import { PingRequestDto, PingResponseDto } from '@/core/dto/ping.dto';

@ApiTags('Server')
@Controller('server')
export class ServerController {
  constructor(
    private readonly getAllServersUseCase: GetAllServersUseCase,
    private readonly getServerByIdUseCase: GetServerByIdUseCase,
    private readonly createServerUseCase: CreateServerUseCase,
    private readonly updateServerUseCase: UpdateServerUseCase,
    private readonly deleteServerUseCase: DeleteServerUseCase,
    private readonly getUserServersUseCase: GetUserServersUseCase,
    private readonly updateServerPriorityUseCase: UpdateServerPriorityUseCase,
    private readonly checkServerPermissionUseCase: CheckServerPermissionUseCase,
    private readonly pingServerUseCase: PingServerUseCase,
    private readonly getServersWithVmsUseCase: GetServersWithVmsUseCase,
  ) {}

  @Get('admin/all')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiOperation({
    summary: 'Lister tous les serveurs',
    description:
      'Renvoie la liste de tous les serveurs enregistrés dans le système. Nécessite le rôle admin.',
  })
  @ApiResponse({ status: 200, type: [ServerResponseDto] })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle admin requis',
  })
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.getAllServersUseCase.execute();
  }

  /**
   * Retrieve all servers with their associated VMs (light representation)
   * 
   * @description
   * This endpoint returns all servers with their VMs in a lightweight format,
   * optimized for frontend list displays. It includes only essential server
   * information and basic VM details (id, name, state) for optimal performance.
   * 
   * @returns Promise<ServerWithVmsResponseDto[]> Array of servers with their VMs
   * 
   * @since 1.0.0
   * 
   * @example
   * GET /server/light-with-vms
   * Response:
   * [
   *   {
   *     "id": "cce1b685-e2bf-4954-9b50-7253797ee8af",
   *     "name": "ESXi-Server-01",
   *     "ip": "192.168.1.10",
   *     "hostMoid": "host-123",
   *     "vms": [
   *       { "id": "vm-1", "name": "VM-Server1-01", "state": "running" },
   *       { "id": "vm-2", "name": "VM-Server1-02", "state": "running" }
   *     ]
   *   }
   * ]
   */
  @Get('light-with-vms')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiOperation({
    summary: 'Lister tous les serveurs avec leurs VMs (format léger)',
    description:
      'Renvoie la liste de tous les serveurs avec leurs VMs dans un format optimisé pour les listes frontend. Inclut uniquement les informations essentielles des serveurs et les détails de base des VMs (id, nom, état) pour des performances optimales.',
  })
  @ApiResponse({ 
    status: 200, 
    type: [ServerWithVmsResponseDto],
    description: 'Liste des serveurs avec leurs VMs'
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle admin requis',
  })
  async getServersWithVms(): Promise<ServerWithVmsResponseDto[]> {
    return this.getServersWithVmsUseCase.execute();
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @Get('admin/:id')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un serveur par ID',
    description:
      'Renvoie les informations d’un serveur spécifique via son UUID.',
  })
  @ApiResponse({ status: 200, type: ServerResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle admin requis',
  })
  async getServerByIdAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServerResponseDto> {
    return this.getServerByIdUseCase.execute(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister mes serveurs accessibles avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ServerListResponseDto })
  async getMyServers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ServerListResponseDto> {
    return this.getUserServersUseCase.execute(
      user.userId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  @UseFilters(InvalidQueryExceptionFilter)
  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à récupérer',
    required: true,
  })
  @ApiResponse({ status: 200, type: ServerResponseDto })
  async getServerById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServerResponseDto> {
    return this.getServerByIdUseCase.execute(id);
  }

  @Post()
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiBody({
    type: ServerCreationDto,
    description: 'Données nécessaires pour créer un nouveau serveur',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer un nouveau serveur',
    description:
      'Crée un serveur avec les données spécifiées dans le `ServerCreationDto`.',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ canCreateServer: true })
  @ApiResponse({ status: 201, type: ServerResponseDto })
  async createServer(
    @Body() serverDto: ServerCreationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ): Promise<ServerResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.createServerUseCase.execute(
      serverDto,
      user.userId,
      requestContext,
    );
  }

  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @Patch(':id')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: ServerUpdateDto,
    description: 'Données nécessaires pour mettre à jour un serveur',
    required: true,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour un serveur',
    description:
      'Met à jour les informations d’un serveur existant via son UUID.',
  })
  @ApiResponse({ status: 200, type: ServerResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  async updateServer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() serverDto: ServerUpdateDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerResponseDto> {
    return this.updateServerUseCase.execute(id, serverDto, user.userId);
  }

  @Put(':id/priority')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur',
    required: true,
  })
  @ApiOperation({
    summary: "Mettre à jour la priorité d'un serveur",
    description: "Met à jour uniquement la priorité d'un serveur",
  })
  @ApiBody({
    type: UpdatePriorityDto,
    description: 'Nouvelle priorité du serveur',
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
    description: 'Serveur non trouvé',
  })
  async updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriorityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ id: string; priority: number }> {
    return this.updateServerPriorityUseCase.execute(
      id,
      dto.priority,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.DELETE,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @Delete(':id')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un serveur',
    description:
      'Supprime un serveur du système à partir de son UUID. Action irréversible. Nécessite la permission DELETE sur le serveur.',
  })
  @ApiResponse({ status: 204, description: 'Serveur supprimé avec succès' })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  @LogToHistory('server', 'DELETE')
  async deleteServer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deleteServerUseCase.execute(id, user.userId);
  }

  @Post('check')
  @UseGuards(JwtAuthGuard)
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check user permission on a server',
    description:
      'Checks if the current user has a specific permission on a given server.',
  })
  @ApiBody({
    type: CheckServerPermissionDto,
    description: 'Server ID and permission to check',
    required: true,
  })
  @ApiResponse({
    status: 200,
    type: ServerPermissionCheckResponseDto,
    description: 'Permission check result',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async checkPermission(
    @Body() dto: CheckServerPermissionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerPermissionCheckResponseDto> {
    return this.checkServerPermissionUseCase.execute(
      dto.serverId,
      user.userId,
      dto.permission,
    );
  }

  @Post(':id/ping')
  @UseGuards(JwtAuthGuard, ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'id',
  })
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à ping',
    required: true,
  })
  @ApiOperation({
    summary: 'Ping server connectivity',
    description:
      'Pings the server to check if it is accessible over the network. Required before listing resources.',
  })
  @ApiBody({
    type: PingRequestDto,
    description: 'Host and timeout configuration for ping',
    required: true,
  })
  @ApiResponse({
    status: 200,
    type: PingResponseDto,
    description: 'Ping result with accessibility status and response time',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async pingServer(
    @Param('id', ParseUUIDPipe) serverId: string,
    @Body() pingDto: PingRequestDto,
    @CurrentUser() _user: JwtPayload,
  ): Promise<PingResponseDto> {
    return this.pingServerUseCase.execute(serverId, pingDto.timeout);
  }
}
