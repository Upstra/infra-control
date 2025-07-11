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
import { VmwarePermissionGuard } from '../../infrastructure/guards/vmware-permission.guard';
import { VmwarePermission } from '../../infrastructure/decorators/vmware-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { Permission } from '@/core/decorators/permission.decorator';
import { PermissionGuard } from '@/core/guards/permission.guard';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
} from '../use-cases';
import { VmwareConnectionDto, VmPowerActionDto, VmMigrateDto } from '../dto';

@ApiTags('VMware')
@ApiBearerAuth()
@Controller('api/vmware')
@UseGuards(JwtAuthGuard)
export class VmwareController {
  constructor(
    private readonly listVmsUseCase: ListVmsUseCase,
    private readonly getVmMetricsUseCase: GetVmMetricsUseCase,
    private readonly controlVmPowerUseCase: ControlVmPowerUseCase,
    private readonly migrateVmUseCase: MigrateVmUseCase,
    private readonly getHostMetricsUseCase: GetHostMetricsUseCase,
  ) {}

  @Get('vms')
  @UseGuards(PermissionGuard)
  @Permission('server', PermissionBit.READ)
  @ApiOperation({ summary: 'List all virtual machines from vCenter/ESXi' })
  @ApiResponse({
    status: 200,
    description: 'List of VMs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid VMware credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async listVMs(@Query() connection: VmwareConnectionDto) {
    return this.listVmsUseCase.execute(connection);
  }

  @Get('vms/:moid/metrics')
  @UseGuards(VmwarePermissionGuard)
  @VmwarePermission(PermissionBit.READ)
  @ApiOperation({ summary: 'Get metrics for a specific VM' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'VM metrics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions on the parent server',
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
  @UseGuards(VmwarePermissionGuard)
  @VmwarePermission(PermissionBit.WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control VM power state' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 200,
    description: 'Power action completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions on the parent server',
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
  @UseGuards(VmwarePermissionGuard)
  @VmwarePermission(PermissionBit.WRITE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Migrate VM to another ESXi host' })
  @ApiParam({ name: 'moid', description: 'VM Managed Object ID' })
  @ApiResponse({
    status: 202,
    description: 'Migration initiated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions on the parent server',
  })
  @ApiResponse({
    status: 404,
    description: 'VM or destination host not found',
  })
  async migrateVM(@Param('moid') moid: string, @Body() dto: VmMigrateDto) {
    return this.migrateVmUseCase.execute(moid, dto);
  }

  @Get('hosts/:moid/metrics')
  @UseGuards(PermissionGuard)
  @Permission('server', PermissionBit.READ)
  @ApiOperation({ summary: 'Get metrics for an ESXi host' })
  @ApiParam({ name: 'moid', description: 'Host Managed Object ID' })
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
    description: 'Host not found',
  })
  async getHostMetrics(
    @Param('moid') moid: string,
    @Query() connection: VmwareConnectionDto,
  ) {
    return this.getHostMetricsUseCase.execute(moid, connection);
  }
}
