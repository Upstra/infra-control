import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { RequireResourcePermission } from '@/core/decorators/ressource-permission.decorator';
import {
  ListVmsUseCase,
  ListServersUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
  StartVMDiscoveryUseCase,
  GetActiveDiscoverySessionUseCase,
  GetDiscoverySessionUseCase,
  ExecuteMigrationPlanUseCase,
  ExecuteRestartPlanUseCase,
  GetMigrationStatusUseCase,
  ClearMigrationDataUseCase,
  SyncServerVmwareDataUseCase,
} from '../use-cases';
import { VmPowerActionDto, VmMigrateDto, VmwareConnectionDto, ListServersResponseDto } from '../dto';
import { SyncServerVmwareDataResponseDto } from '../dto/sync-server-response.dto';
import {
  ExecuteMigrationPlanDto,
  MigrationStatusResponseDto,
} from '../dto/migration-plan.dto';

@ApiTags('VMware')
@ApiBearerAuth()
@Controller('vmware/servers')
@UseGuards(JwtAuthGuard)
export class VmwareController {
  constructor(
    private readonly listVmsUseCase: ListVmsUseCase,
    private readonly listServersUseCase: ListServersUseCase,
    private readonly getVmMetricsUseCase: GetVmMetricsUseCase,
    private readonly controlVmPowerUseCase: ControlVmPowerUseCase,
    private readonly migrateVmUseCase: MigrateVmUseCase,
    private readonly getHostMetricsUseCase: GetHostMetricsUseCase,
    private readonly startVMDiscoveryUseCase: StartVMDiscoveryUseCase,
    private readonly getActiveDiscoverySessionUseCase: GetActiveDiscoverySessionUseCase,
    private readonly getDiscoverySessionUseCase: GetDiscoverySessionUseCase,
    private readonly executeMigrationPlanUseCase: ExecuteMigrationPlanUseCase,
    private readonly executeRestartPlanUseCase: ExecuteRestartPlanUseCase,
    private readonly getMigrationStatusUseCase: GetMigrationStatusUseCase,
    private readonly clearMigrationDataUseCase: ClearMigrationDataUseCase,
    private readonly syncServerVmwareDataUseCase: SyncServerVmwareDataUseCase,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all ESXi servers in the vCenter infrastructure',
  })
  @ApiBody({
    type: VmwareConnectionDto,
    description: 'vCenter connection credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'List of servers retrieved successfully',
    type: ListServersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid vCenter credentials',
  })
  async listServers(@Body() connection: VmwareConnectionDto): Promise<ListServersResponseDto> {
    const servers = await this.listServersUseCase.execute(connection);
    return { servers };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synchronize VMware data with existing servers in database',
  })
  @ApiBody({
    type: VmwareConnectionDto,
    description: 'vCenter connection credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Synchronization completed successfully',
    type: SyncServerVmwareDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid vCenter credentials',
  })
  async syncServerVmwareData(@Body() connection: VmwareConnectionDto): Promise<SyncServerVmwareDataResponseDto> {
    return this.syncServerVmwareDataUseCase.execute(connection);
  }

  @Get(':serverId/vms')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({ summary: 'List all virtual machines from a server' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiResponse({
    status: 200,
    description: 'List of VMs retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async listVMs(@Param('serverId') serverId: string) {
    return this.listVmsUseCase.execute(serverId);
  }

  @Get(':serverId/vms/:moid/metrics')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({ summary: 'Get metrics for a specific VM' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'VM metrics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Server or VM not found',
  })
  async getVMMetrics(
    @Param('serverId') serverId: string,
    @Param('moid') moid: string,
  ) {
    return this.getVmMetricsUseCase.execute(serverId, moid);
  }

  @Post(':serverId/vms/:moid/power')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control VM power state' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Power action completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Server or VM not found',
  })
  async controlVMPower(
    @Param('serverId') serverId: string,
    @Param('moid') moid: string,
    @Body() dto: VmPowerActionDto,
  ) {
    return this.controlVmPowerUseCase.execute(serverId, moid, dto.action);
  }

  @Post(':serverId/vms/:moid/migrate')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Migrate VM to another ESXi host' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 202,
    description: 'Migration initiated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Server, VM or destination host not found',
  })
  async migrateVM(
    @Param('serverId') serverId: string,
    @Param('moid') moid: string,
    @Body() dto: VmMigrateDto,
  ) {
    return this.migrateVmUseCase.execute(serverId, moid, dto.destinationMoid);
  }

  @Get(':serverId/metrics')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({ summary: 'Get ESXi host metrics' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiResponse({
    status: 200,
    description: 'Host metrics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async getHostMetrics(@Param('serverId') serverId: string) {
    return this.getHostMetricsUseCase.execute(serverId);
  }

  @Post('discovery/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start VM discovery process' })
  @ApiResponse({
    status: 202,
    description: 'Discovery started successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        serverCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async startVMDiscovery(@Body() body?: { serverIds?: number[] }) {
    return this.startVMDiscoveryUseCase.execute({ serverIds: body?.serverIds });
  }

  @Get('discovery/active')
  @ApiOperation({ summary: 'Get active discovery session' })
  @ApiResponse({
    status: 200,
    description: 'Active discovery session retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active discovery session found',
  })
  async getActiveDiscoverySession() {
    const session = await this.getActiveDiscoverySessionUseCase.execute();

    if (!session) {
      return { active: false };
    }

    return {
      active: true,
      session,
    };
  }

  @Get('discovery/session/:sessionId')
  @ApiOperation({ summary: 'Get specific discovery session' })
  @ApiParam({ name: 'sessionId', description: 'Discovery session ID' })
  @ApiResponse({
    status: 200,
    description: 'Discovery session retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Discovery session not found',
  })
  async getDiscoverySession(@Param('sessionId') sessionId: string) {
    return this.getDiscoverySessionUseCase.execute(sessionId);
  }

  @Post('migration/plan')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Execute UPS migration plan' })
  @ApiResponse({
    status: 202,
    description: 'Migration plan started successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or migration already in progress',
  })
  async executeMigrationPlan(@Body() dto: ExecuteMigrationPlanDto) {
    return this.executeMigrationPlanUseCase.execute(dto.planPath);
  }

  @Post('migration/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute restart plan after migration' })
  @ApiResponse({
    status: 200,
    description: 'Restart plan executed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state for restart',
  })
  async executeRestartPlan() {
    return this.executeRestartPlanUseCase.execute();
  }

  @Get('migration/status')
  @ApiOperation({ summary: 'Get current migration status' })
  @ApiResponse({
    status: 200,
    description: 'Migration status retrieved successfully',
    type: MigrationStatusResponseDto,
  })
  async getMigrationStatus(): Promise<MigrationStatusResponseDto> {
    return this.getMigrationStatusUseCase.execute();
  }

  @Delete('migration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear migration data from Redis' })
  @ApiResponse({
    status: 204,
    description: 'Migration data cleared successfully',
  })
  async clearMigrationData() {
    await this.clearMigrationDataUseCase.execute();
  }
}
