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
import { PermissionVmDto } from '../dto/permission.vm.dto';
import { BatchPermissionVmDto, BatchPermissionVmResponseDto } from '../dto/batch-permission.vm.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

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
  @ApiOperation({ summary: 'Créer une nouvelle permission VM' })
  @ApiBody({ type: PermissionVmDto })
  @ApiResponse({ status: 201, type: PermissionVmDto })
  async createPermission(
    @Body() dto: PermissionVmDto,
  ): Promise<PermissionVmDto> {
    return this.createPermissionUseCase.execute(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Créer plusieurs permissions VM en une fois' })
  @ApiBody({ type: BatchPermissionVmDto })
  @ApiResponse({ status: 201, type: BatchPermissionVmResponseDto })
  async createBatchPermissions(
    @Body() dto: BatchPermissionVmDto,
  ): Promise<BatchPermissionVmResponseDto> {
    return this.createBatchPermissionUseCase.execute(dto);
  }

  @Patch(':vmId/role/:roleId')
  @ApiOperation({ summary: 'Modifier une permission VM existante' })
  @ApiParam({ name: 'vmId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiBody({ type: PermissionVmDto })
  @ApiResponse({ status: 200, type: PermissionVmDto })
  async updatePermission(
    @Param('vmId', ParseUUIDPipe) vmId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: PermissionVmDto,
  ): Promise<PermissionVmDto> {
    return this.updatePermissionUseCase.execute(vmId, roleId, dto);
  }

  @Delete(':vmId/role/:roleId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer une permission VM' })
  @ApiParam({ name: 'vmId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Permission supprimée avec succès' })
  async deletePermission(
    @Param('vmId', ParseUUIDPipe) vmId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    return this.deletePermissionUseCase.execute(vmId, roleId);
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
