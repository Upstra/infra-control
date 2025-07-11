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
import { Permissions } from '@/core/decorators/permission.decorator';
import { PermissionGuard } from '@/core/guards/permission.guard';
import { Permission } from '@/modules/permissions/domain/enums/permission.enum';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
} from '../use-cases';
import {
  VmwareConnectionDto,
  VmPowerActionDto,
  VmMigrateDto,
} from '../dto';

@ApiTags('VMware')
@ApiBearerAuth()
@Controller('api/vmware')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VmwareController {
  constructor(
    private readonly listVmsUseCase: ListVmsUseCase,
    private readonly getVmMetricsUseCase: GetVmMetricsUseCase,
    private readonly controlVmPowerUseCase: ControlVmPowerUseCase,
    private readonly migrateVmUseCase: MigrateVmUseCase,
    private readonly getHostMetricsUseCase: GetHostMetricsUseCase,
  ) {}

  @Get('vms')
  @Permissions(Permission.VM_READ)
  @ApiOperation({ summary: 'List all virtual machines from vCenter/ESXi' })
  @ApiResponse({
    status: 200,
    description: 'List of VMs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid VMware credentials',
  })
  async listVMs(@Query() connection: VmwareConnectionDto) {
    return this.listVmsUseCase.execute(connection);
  }

  @Get('vms/:moid/metrics')
  @Permissions(Permission.VM_READ)
  @ApiOperation({ summary: 'Get metrics for a specific VM' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'VM metrics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'VM not found',
  })
  async getVMMetrics(
    @Param('moid') moid: string,
    @Query() connection: VmwareConnectionDto,
  ) {
    return this.getVmMetricsUseCase.execute(moid, connection);
  }

  @Post('vms/:moid/power')
  @Permissions(Permission.VM_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control VM power state' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Power action completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'VM not found',
  })
  async controlVMPower(
    @Param('moid') moid: string,
    @Body() dto: VmPowerActionDto,
  ) {
    return this.controlVmPowerUseCase.execute(moid, dto);
  }

  @Post('vms/:moid/migrate')
  @Permissions(Permission.VM_UPDATE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Migrate VM to another ESXi host' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 202,
    description: 'Migration initiated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'VM or destination host not found',
  })
  async migrateVM(
    @Param('moid') moid: string,
    @Body() dto: VmMigrateDto,
  ) {
    return this.migrateVmUseCase.execute(moid, dto);
  }

  @Get('hosts/:moid/metrics')
  @Permissions(Permission.SERVER_READ)
  @ApiOperation({ summary: 'Get metrics for an ESXi host' })
  @ApiParam({ name: 'moid', description: 'Host Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Host metrics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Host not found',
  })
  async getHostMetrics(
    @Param('moid') moid: string,
    @Query() connection: VmwareConnectionDto,
  ) {
    return this.getHostMetricsUseCase.execute(moid, connection);
  }
}