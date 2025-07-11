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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { IloPermissionGuard } from '../../infrastructure/guards/ilo-permission.guard';
import { IloPermission } from '../../infrastructure/decorators/ilo-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ControlServerPowerUseCase } from '../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../use-cases/get-server-status.use-case';
import {
  IloPowerActionDto,
  IloCredentialsDto,
} from '../dto/ilo-power-action.dto';
import {
  IloPowerResponseDto,
  IloStatusResponseDto,
} from '../dto/ilo-status.dto';

@ApiTags('iLO')
@ApiBearerAuth()
@Controller('api/ilo')
@UseGuards(JwtAuthGuard, IloPermissionGuard)
export class IloPowerController {
  constructor(
    private readonly controlServerPowerUseCase: ControlServerPowerUseCase,
    private readonly getServerStatusUseCase: GetServerStatusUseCase,
  ) {}

  @Post('servers/:ip/power')
  @IloPermission(PermissionBit.WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control physical server power state' })
  @ApiParam({ name: 'ip', description: 'Server iLO IP address' })
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
    description: 'Server with this iLO IP not found',
  })
  async controlServerPower(
    @Param('ip') ip: string,
    @Body() dto: IloPowerActionDto,
  ): Promise<IloPowerResponseDto> {
    return this.controlServerPowerUseCase.execute(ip, dto);
  }

  @Get('servers/:ip/status')
  @IloPermission(PermissionBit.READ)
  @ApiOperation({ summary: 'Get physical server power status' })
  @ApiParam({ name: 'ip', description: 'Server iLO IP address' })
  @ApiQuery({ name: 'user', description: 'iLO username', required: true })
  @ApiQuery({ name: 'password', description: 'iLO password', required: true })
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
    description: 'Server with this iLO IP not found',
  })
  async getServerStatus(
    @Param('ip') ip: string,
    @Query('user') user: string,
    @Query('password') password: string,
  ): Promise<IloStatusResponseDto> {
    const credentials: IloCredentialsDto = { user, password };
    return this.getServerStatusUseCase.execute(ip, credentials);
  }
}
