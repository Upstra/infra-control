import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseFilters,
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
import { ControlServerPowerUseCase } from '../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../use-cases/get-server-status.use-case';
import { PingIloUseCase } from '../use-cases/ping-ilo.use-case';
import { IloPowerActionDto } from '../dto/ilo-power-action.dto';
import {
  IloPowerResponseDto,
  IloStatusResponseDto,
} from '../dto/ilo-status.dto';
import { PingRequestDto, PingResponseDto } from '@/core/dto/ping.dto';
import { PythonErrorInterceptor } from '@/core/interceptors/python-error.interceptor';

@ApiTags('iLO')
@ApiBearerAuth()
@Controller('ilo/servers')
@UseGuards(JwtAuthGuard)
@UseFilters(PythonErrorInterceptor)
export class IloPowerController {
  constructor(
    private readonly controlServerPowerUseCase: ControlServerPowerUseCase,
    private readonly getServerStatusUseCase: GetServerStatusUseCase,
    private readonly pingIloUseCase: PingIloUseCase,
  ) {}

  @Post(':serverId/power')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.WRITE,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control physical server power state' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiResponse({
    status: 200,
    description: 'Power action completed successfully',
    type: IloPowerResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid iLO credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to control this server',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async controlServerPower(
    @Param('serverId') serverId: string,
    @Body() dto: IloPowerActionDto,
  ): Promise<IloPowerResponseDto> {
    return this.controlServerPowerUseCase.execute(serverId, dto.action);
  }

  @Get(':serverId/status')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({ summary: 'Get physical server power status' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiResponse({
    status: 200,
    description: 'Server status retrieved successfully',
    type: IloStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid iLO credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to read this server status',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async getServerStatus(
    @Param('serverId') serverId: string,
  ): Promise<IloStatusResponseDto> {
    return this.getServerStatusUseCase.execute(serverId);
  }

  @Post(':serverId/ping')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({
    summary: 'Ping iLO connectivity',
    description:
      'Pings the iLO interface to check if it is accessible over the network. Required before checking server status or controlling power.',
  })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiResponse({
    status: 200,
    description: 'Ping result with accessibility status and response time',
    type: PingResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async pingIlo(
    @Param('serverId') serverId: string,
    @Body() pingDto: PingRequestDto,
  ): Promise<PingResponseDto> {
    return this.pingIloUseCase.execute(serverId, pingDto.timeout);
  }
}
