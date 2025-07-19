import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
// TODO: import { RedisCacheInterceptor } from '../../../core/cache/redis-cache.interceptor';
import { DashboardRateLimitGuard } from '../guards/dashboard-rate-limit.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ActivityFeedResponseDto,
  AlertsResponseDto,
  UserPresenceResponseDto,
  SystemHealthResponseDto,
  UpsStatusResponseDto,
  WidgetDataQueryDto,
  ExportQueryDto,
} from '../dto/widget-data.dto';
import {
  GetActivityFeedUseCase,
  GetAlertsUseCase,
  GetUserPresenceUseCase,
  GetSystemHealthUseCase,
  GetUpsStatusUseCase,
  ExportWidgetDataUseCase,
} from '../use-cases/widgets';

@ApiTags('Dashboard Widgets')
@Controller('dashboard/widgets')
@UseGuards(JwtAuthGuard, DashboardRateLimitGuard)
@ApiBearerAuth()
export class DashboardWidgetController {
  constructor(
    private readonly getActivityFeedUseCase: GetActivityFeedUseCase,
    private readonly getAlertsUseCase: GetAlertsUseCase,
    private readonly getUserPresenceUseCase: GetUserPresenceUseCase,
    private readonly getSystemHealthUseCase: GetSystemHealthUseCase,
    private readonly getUpsStatusUseCase: GetUpsStatusUseCase,
    private readonly exportWidgetDataUseCase: ExportWidgetDataUseCase,
  ) {}

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get activity feed data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity feed data',
    type: ActivityFeedResponseDto,
  })
  // TODO: @UseInterceptors(RedisCacheInterceptor)
  async getActivityFeed(
    @Query() query: WidgetDataQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    return this.getActivityFeedUseCase.execute(query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alerts data',
    type: AlertsResponseDto,
  })
  // TODO: @UseInterceptors(RedisCacheInterceptor)
  async getAlerts(
    @Query() query: WidgetDataQueryDto,
  ): Promise<AlertsResponseDto> {
    return this.getAlertsUseCase.execute(query);
  }

  @Get('user-presence')
  @ApiOperation({ summary: 'Get user presence data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User presence data',
    type: UserPresenceResponseDto,
  })
  // TODO: @UseInterceptors(RedisCacheInterceptor)
  async getUserPresence(): Promise<UserPresenceResponseDto> {
    return this.getUserPresenceUseCase.execute();
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health data',
    type: SystemHealthResponseDto,
  })
  // TODO: @UseInterceptors(RedisCacheInterceptor)
  async getSystemHealth(): Promise<SystemHealthResponseDto> {
    return this.getSystemHealthUseCase.execute();
  }

  @Get('ups-status')
  @ApiOperation({ summary: 'Get UPS status data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'UPS status data',
    type: UpsStatusResponseDto,
  })
  // TODO: @UseInterceptors(RedisCacheInterceptor)
  async getUpsStatus(): Promise<UpsStatusResponseDto> {
    return this.getUpsStatusUseCase.execute();
  }

  @Get(':widgetId/export')
  @ApiOperation({ summary: 'Export widget data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Widget data exported',
  })
  async exportWidgetData(
    @Param('widgetId') widgetId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportWidgetDataUseCase.execute(widgetId, query);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.data);
  }
}
