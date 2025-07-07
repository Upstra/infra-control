import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  PermissionServerDto,
  UpdatePermissionServerDto,
} from '../dto/permission.server.dto';
import {
  BatchPermissionServerDto,
  BatchPermissionServerResponseDto,
} from '../dto/batch-permission.server.dto';
import { CreatePermissionServerUseCase } from '../use-cases/permission-server/create-permission-server.use-case';
import { CreateBatchPermissionServerUseCase } from '../use-cases/permission-server/create-batch-permission-server.use-case';
import { GetPermissionsServerByRoleUseCase } from '../use-cases/permission-server/get-permission-server-by-role.use-case';
import { GetPermissionServerByIdsUseCase } from '../use-cases/permission-server/get-permission-server-by-ids.use-case';
import { UpdatePermissionServerUseCase } from '../use-cases/permission-server/update-permission-server.use-case';
import { DeletePermissionServerUseCase } from '../use-cases/permission-server/delete-permission-server.use-case';
import { GetUserServerPermissionsUseCase } from '../use-cases/permission-server/get-user-permission-server-use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { LogToHistory } from '@/core/decorators/logging-context.decorator';

@ApiTags('Permissions - Serveur')
@Controller('permissions/server')
export class PermissionServerController {
  constructor(
    private readonly createPermissionUsecase: CreatePermissionServerUseCase,
    private readonly createBatchPermissionUsecase: CreateBatchPermissionServerUseCase,
    private readonly getAllByRoleUsecase: GetPermissionsServerByRoleUseCase,
    private readonly getByIdsUsecase: GetPermissionServerByIdsUseCase,
    private readonly updatePermissionUsecase: UpdatePermissionServerUseCase,
    private readonly deletePermissionUsecase: DeletePermissionServerUseCase,
    private readonly getUserServerPermissionsUseCase: GetUserServerPermissionsUseCase,
  ) {}

  @Get('role/:roleId')
  @ApiOperation({
    summary: 'Lister les permissions d’un rôle sur tous les serveurs',
  })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PermissionServerDto] })
  async getPermissionsByRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionServerDto[]> {
    return this.getAllByRoleUsecase.execute(roleId);
  }

  @Get(':serverId/role/:roleId')
  @ApiOperation({ summary: 'Récupérer une permission par rôle + serveur' })
  @ApiParam({ name: 'serverId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PermissionServerDto })
  async getPermissionByIds(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionServerDto> {
    return this.getByIdsUsecase.execute(serverId, roleId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle permission serveur' })
  @ApiBody({ type: PermissionServerDto })
  @ApiResponse({ status: 201, type: PermissionServerDto })
  @LogToHistory('permission_server', 'CREATE', {
    extractMetadata: (data) => ({
      serverId: data.serverId,
      roleId: data.roleId,
      bitmask: data.bitmask,
    }),
  })
  async createPermission(
    @Body() dto: PermissionServerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionServerDto> {
    return this.createPermissionUsecase.execute(dto, user.userId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer plusieurs permissions serveur en une fois' })
  @ApiBody({ type: BatchPermissionServerDto })
  @ApiResponse({ status: 201, type: BatchPermissionServerResponseDto })
  @LogToHistory('permission_server', 'BATCH_CREATE', {
    extractMetadata: (data) => ({
      permissionsCount: data.permissions?.length || 0,
    }),
  })
  async createBatchPermissions(
    @Body() dto: BatchPermissionServerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BatchPermissionServerResponseDto> {
    return this.createBatchPermissionUsecase.execute(dto, user.userId);
  }

  @Patch(':serverId/role/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une permission serveur existante' })
  @ApiParam({ name: 'serverId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdatePermissionServerDto })
  @ApiResponse({ status: 200, type: PermissionServerDto })
  @LogToHistory('permission_server', 'UPDATE', {
    extractMetadata: (data) => ({
      serverId: data.serverId,
      roleId: data.roleId,
      newBitmask: data.bitmask,
    }),
  })
  async updatePermission(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdatePermissionServerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionServerDto> {
    return this.updatePermissionUsecase.execute(
      serverId,
      roleId,
      dto,
      user.userId,
    );
  }

  @Delete(':serverId/role/:roleId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une permission serveur' })
  @ApiParam({ name: 'serverId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Permission supprimée avec succès' })
  @LogToHistory('permission_server', 'DELETE')
  async deletePermission(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deletePermissionUsecase.execute(serverId, roleId, user.userId);
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Récupérer les permissions d’un utilisateur' })
  @ApiResponse({ status: 200, type: [PermissionServerDto] })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserPermissionsMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionServerDto[]> {
    return this.getUserServerPermissionsUseCase.execute(user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les permissions d’un utilisateur' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PermissionServerDto] })
  async getUserPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PermissionServerDto[]> {
    return this.getUserServerPermissionsUseCase.execute(userId);
  }
}
