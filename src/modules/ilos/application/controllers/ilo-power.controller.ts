import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseFilters,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RequestContextDto } from '@/core/dto';

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
    requiredBit: PermissionBit.SHUTDOWN,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control server power state via iLO' })
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
    description:
      'Insufficient permissions - requires SHUTDOWN permission on this server or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Server not found',
  })
  async controlServerPower(
    @Param('serverId') serverId: string,
    @Body() dto: IloPowerActionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ): Promise<IloPowerResponseDto> {
    const requestContext = RequestContextDto.fromRequest(req);
    return this.controlServerPowerUseCase.execute(
      serverId,
      dto.action,
      user.userId,
      requestContext,
    );
  }

  @Get(':serverId/status')
  @UseGuards(ResourcePermissionGuard)
  @RequireResourcePermission({
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  })
  @ApiOperation({ summary: 'Get server power status via iLO' })
  @ApiParam({ name: 'serverId', description: 'Server ID' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Force refresh metrics from vCenter instead of using cache',
  })
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
    @Query('force') force?: boolean,
  ): Promise<IloStatusResponseDto> {
    return this.getServerStatusUseCase.execute(serverId, force);
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
    summary: 'Ping iLO server to check connectivity',
    description:
      'Pings the iLO interface to check if it is accessible over the network. Required before checking server status or controlling power.',
    deprecated: true,
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
