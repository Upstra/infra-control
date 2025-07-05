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
  GetServerByIdWithPermissionCheckUseCase,
  UpdateServerPriorityUseCase,
} from '@/modules/servers/application/use-cases';

import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerUpdateDto } from '../dto/server.update.dto';
import { ServerListResponseDto } from '../dto/server.list.response.dto';
import { UpdatePriorityDto } from '../../../priorities/application/dto/update-priority.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { PermissionGuard } from '@/core/guards';
import { RequestContextDto } from '@/core/dto';

@ApiTags('Server')
@Controller('server')
export class ServerController {
  constructor(
    private readonly getAllServersUseCase: GetAllServersUseCase,
    private readonly getServerByIdUseCase: GetServerByIdUseCase,
    private readonly createServerUseCase: CreateServerUseCase,
    private readonly updateServerUseCase: UpdateServerUseCase,
    private readonly deleteServerUseCase: DeleteServerUseCase,
    private readonly getServerByIdWithPermissionCheckUseCase: GetServerByIdWithPermissionCheckUseCase,
    private readonly getUserServersUseCase: GetUserServersUseCase,
    private readonly updateServerPriorityUseCase: UpdateServerPriorityUseCase,
  ) {}

  @Get('admin/all')
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({
    summary: 'Lister tous les serveurs',
    description:
      'Renvoie la liste de tous les serveurs enregistrés dans le système.',
  })
  @ApiResponse({ status: 200, type: [ServerResponseDto] })
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.getAllServersUseCase.execute();
  }

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
  @UseGuards(JwtAuthGuard)
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
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerResponseDto> {
    return this.getServerByIdWithPermissionCheckUseCase.execute(
      id,
      user.userId,
    );
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour la priorité d\'un serveur',
    description: 'Met à jour uniquement la priorité d\'un serveur',
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
    return this.updateServerPriorityUseCase.execute(id, dto.priority, user.userId);
  }

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
      'Supprime un serveur du système à partir de son UUID. Action irréversible.',
  })
  @ApiResponse({ status: 204, description: 'Serveur supprimé avec succès' })
  async deleteServer(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteServerUseCase.execute(id);
  }
}
