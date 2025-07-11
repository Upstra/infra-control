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
import { Permissions } from '@/core/decorators/permission.decorator';
import { PermissionGuard } from '@/core/guards/permission.guard';
import { Permission } from '@/modules/permissions/domain/enums/permission.enum';
import { ControlServerPowerUseCase } from '../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../use-cases/get-server-status.use-case';
import { IloPowerActionDto, IloCredentialsDto } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto, IloStatusResponseDto } from '../dto/ilo-status.dto';

@ApiTags('iLO')
@ApiBearerAuth()
@Controller('api/ilo')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IloPowerController {
  constructor(
    private readonly controlServerPowerUseCase: ControlServerPowerUseCase,
    private readonly getServerStatusUseCase: GetServerStatusUseCase,
  ) {}

  @Post('servers/:ip/power')
  @Permissions(Permission.SERVER_UPDATE)
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
  async controlServerPower(
    @Param('ip') ip: string,
    @Body() dto: IloPowerActionDto,
  ): Promise<IloPowerResponseDto> {
    return this.controlServerPowerUseCase.execute(ip, dto);
  }

  @Get('servers/:ip/status')
  @Permissions(Permission.SERVER_READ)
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
  async getServerStatus(
    @Param('ip') ip: string,
    @Query('user') user: string,
    @Query('password') password: string,
  ): Promise<IloStatusResponseDto> {
    const credentials: IloCredentialsDto = { user, password };
    return this.getServerStatusUseCase.execute(ip, credentials);
  }
}