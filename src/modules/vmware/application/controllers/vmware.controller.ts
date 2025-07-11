import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { RequireResourcePermission } from '@/core/decorators/ressource-permission.decorator';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
} from '../use-cases';
import { VmPowerActionDto, VmMigrateDto } from '../dto';

@ApiTags('VMware')
@ApiBearerAuth()
@Controller('api/vmware/servers')
@UseGuards(JwtAuthGuard)
export class VmwareController {
  constructor(
    private readonly listVmsUseCase: ListVmsUseCase,
    private readonly getVmMetricsUseCase: GetVmMetricsUseCase,
    private readonly controlVmPowerUseCase: ControlVmPowerUseCase,
    private readonly migrateVmUseCase: MigrateVmUseCase,
  ) {}

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

}
