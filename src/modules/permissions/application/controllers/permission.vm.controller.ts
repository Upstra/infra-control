import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePermissionVmUseCase,
  CreateBatchPermissionVmUseCase,
  GetPermissionsVmByRoleUseCase,
  GetPermissionVmByIdsUseCase,
  UpdatePermissionVmUseCase,
  DeletePermissionVmUseCase,
  GetUserVmPermissionsUseCase,
} from '../use-cases/permission-vm';
import {
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  PermissionVmDto,
  UpdatePermissionVmDto,
} from '../dto/permission.vm.dto';
import {
  BatchPermissionVmDto,
  BatchPermissionVmResponseDto,
} from '../dto/batch-permission.vm.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { LogToHistory } from '@/core/decorators/logging-context.decorator';

@ApiTags('Permissions - VM')
@Controller('permissions/vm')
export class PermissionVmController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionVmUseCase,
    private readonly createBatchPermissionUseCase: CreateBatchPermissionVmUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionVmUseCase,
    private readonly getByIdsUseCase: GetPermissionVmByIdsUseCase,
    private readonly getAllByRoleUseCase: GetPermissionsVmByRoleUseCase,
    private readonly deletePermissionUseCase: DeletePermissionVmUseCase,
    private readonly getUserVmPermissionsUseCase: GetUserVmPermissionsUseCase,
  ) {}

  @Get('role/:roleId')
  @ApiOperation({
    summary: "Lister les permissions d'un rôle sur toutes les VMs",
  })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PermissionVmDto] })
  async getPermissionsByRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionVmDto[]> {
    return this.getAllByRoleUseCase.execute(roleId);
  }

  @Get(':vmId/role/:roleId')
  @ApiOperation({ summary: 'Récupérer une permission par rôle + VM' })
  @ApiParam({ name: 'vmId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PermissionVmDto })
  async getPermissionByIds(
    @Param('vmId', ParseUUIDPipe) vmId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionVmDto> {
    return this.getByIdsUseCase.execute(vmId, roleId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle permission VM' })
  @ApiBody({ type: PermissionVmDto })
  @ApiResponse({ status: 201, type: PermissionVmDto })
  @LogToHistory('permission_vm', 'CREATE', {
    extractMetadata: (data) => ({
      vmId: data.vmId,
      roleId: data.roleId,
      bitmask: data.bitmask,
    }),
  })
  async createPermission(
    @Body() dto: PermissionVmDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionVmDto> {
    return this.createPermissionUseCase.execute(dto, user.userId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer plusieurs permissions VM en une fois' })
  @ApiBody({ type: BatchPermissionVmDto })
  @ApiResponse({ status: 201, type: BatchPermissionVmResponseDto })
  @LogToHistory('permission_vm', 'BATCH_CREATE', {
    extractMetadata: (data) => ({
      permissionsCount: data.permissions?.length || 0,
    }),
  })
  async createBatchPermissions(
    @Body() dto: BatchPermissionVmDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BatchPermissionVmResponseDto> {
    return this.createBatchPermissionUseCase.execute(dto, user.userId);
  }

  @Patch(':vmId/role/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une permission VM existante' })
  @ApiParam({ name: 'vmId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdatePermissionVmDto })
  @ApiResponse({ status: 200, type: PermissionVmDto })
  @LogToHistory('permission_vm', 'UPDATE', {
    extractMetadata: (data) => ({
      vmId: data.vmId,
      roleId: data.roleId,
      newBitmask: data.bitmask,
    }),
  })
  async updatePermission(
    @Param('vmId', ParseUUIDPipe) vmId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdatePermissionVmDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionVmDto> {
    return this.updatePermissionUseCase.execute(vmId, roleId, dto, user.userId);
  }

  @Delete(':vmId/role/:roleId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une permission VM' })
  @ApiParam({ name: 'vmId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Permission supprimée avec succès' })
  @LogToHistory('permission_vm', 'DELETE')
  async deletePermission(
    @Param('vmId', ParseUUIDPipe) vmId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deletePermissionUseCase.execute(vmId, roleId, user.userId);
  }

  @Get('user/me')
  @ApiOperation({ summary: "Récupérer les permissions d'un utilisateur" })
  @ApiResponse({ status: 200, type: [PermissionVmDto] })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserPermissionsMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<PermissionVmDto[]> {
    return this.getUserVmPermissionsUseCase.execute(user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Récupérer les permissions d'un utilisateur" })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PermissionVmDto] })
  async getUserPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PermissionVmDto[]> {
    return this.getUserVmPermissionsUseCase.execute(userId);
  }
}
