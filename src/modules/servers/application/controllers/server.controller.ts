import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import {
  GetAllServersUseCase,
  GetServerByIdUseCase,
  CreateServerUseCase,
  UpdateServerUseCase,
  DeleteServerUseCase,
  GetUserServersUseCase,
  GetServerByIdWithPermissionCheckUseCase,
} from '@/modules/servers/application/use-cases';

import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerUpdateDto } from '../dto/server.update.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { PermissionGuard } from '@/core/guards';

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
  @ApiOperation({ summary: 'Lister mes serveurs accessibles' })
  @ApiResponse({ status: 200, type: [ServerResponseDto] })
  async getMyServers(
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerResponseDto[]> {
    return this.getUserServersUseCase.execute(user.userId);
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
  ): Promise<ServerResponseDto> {
    return this.createServerUseCase.execute(serverDto, user.userId);
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
  ): Promise<ServerResponseDto> {
    return this.updateServerUseCase.execute(id, serverDto);
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
