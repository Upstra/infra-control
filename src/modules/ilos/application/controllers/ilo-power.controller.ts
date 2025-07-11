import {
  Controller,
  Get,
  Post,
  Param,
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
import { ControlServerPowerUseCase } from '../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../use-cases/get-server-status.use-case';
import { IloPowerActionDto } from '../dto/ilo-power-action.dto';
import {
  IloPowerResponseDto,
  IloStatusResponseDto,
} from '../dto/ilo-status.dto';

@ApiTags('iLO')
@ApiBearerAuth()
@Controller('api/ilo/servers')
@UseGuards(JwtAuthGuard)
export class IloPowerController {
  constructor(
    private readonly controlServerPowerUseCase: ControlServerPowerUseCase,
    private readonly getServerStatusUseCase: GetServerStatusUseCase,
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
}
