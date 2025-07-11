import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityActorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar?: string;
}

export class ActivityTargetDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: ActivityActorDto })
  actor: ActivityActorDto;

  @ApiProperty({ type: ActivityTargetDto })
  target: ActivityTargetDto;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  description: string;
}

export class ActivityFeedResponseDto {
  @ApiProperty({ type: [ActivityDto] })
  activities: ActivityDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Alerts DTOs
export class AlertResourceDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class AlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['critical', 'warning', 'info'] })
  severity: 'critical' | 'warning' | 'info';

  @ApiProperty()
  type: string;

  @ApiProperty({ type: AlertResourceDto })
  resource: AlertResourceDto;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  acknowledged: boolean;
}

export class AlertsSummaryDto {
  @ApiProperty()
  critical: number;

  @ApiProperty()
  warning: number;

  @ApiProperty()
  info: number;
}

export class AlertsResponseDto {
  @ApiProperty({ type: [AlertDto] })
  alerts: AlertDto[];

  @ApiProperty({ type: AlertsSummaryDto })
  summary: AlertsSummaryDto;
}

export class ResourceHistoryPointDto {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  value: number;
}

export class ResourceMetricDto {
  @ApiProperty()
  usage: number;

  @ApiProperty({ enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';

  @ApiPropertyOptional({ type: [ResourceHistoryPointDto] })
  history?: ResourceHistoryPointDto[];

  @ApiPropertyOptional()
  total?: string;

  @ApiPropertyOptional()
  used?: string;
}

export class NetworkMetricDto {
  @ApiProperty()
  inbound: string;

  @ApiProperty()
  outbound: string;

  @ApiProperty({ enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';
}

export class ResourceUsageResponseDto {
  @ApiProperty({ type: ResourceMetricDto })
  cpu: ResourceMetricDto;

  @ApiProperty({ type: ResourceMetricDto })
  memory: ResourceMetricDto;

  @ApiProperty({ type: ResourceMetricDto })
  storage: ResourceMetricDto;

  @ApiProperty({ type: NetworkMetricDto })
  network: NetworkMetricDto;
}

export class OnlineUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty({ enum: ['active', 'idle'] })
  status: 'active' | 'idle';

  @ApiProperty()
  location: string;

  @ApiProperty()
  lastSeen: Date;
}

export class RecentlyOfflineUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lastSeen: Date;
}

export class UserPresenceSummaryDto {
  @ApiProperty()
  online: number;

  @ApiProperty()
  idle: number;

  @ApiProperty()
  offline: number;
}

export class UserPresenceResponseDto {
  @ApiProperty({ type: [OnlineUserDto] })
  onlineUsers: OnlineUserDto[];

  @ApiProperty({ type: [RecentlyOfflineUserDto] })
  recentlyOffline: RecentlyOfflineUserDto[];

  @ApiProperty({ type: UserPresenceSummaryDto })
  summary: UserPresenceSummaryDto;
}

// System Health DTOs
export class SystemComponentDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['operational', 'degraded', 'down'] })
  status: 'operational' | 'degraded' | 'down';

  @ApiProperty()
  responseTime: number;

  @ApiProperty()
  uptime: number;

  @ApiPropertyOptional({ type: [String] })
  issues?: string[];
}

export class SystemHealthResponseDto {
  @ApiProperty({ enum: ['healthy', 'degraded', 'unhealthy'] })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty()
  score: number;

  @ApiProperty({ type: [SystemComponentDto] })
  components: SystemComponentDto[];

  @ApiProperty()
  lastCheck: Date;
}

export class UpsStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['online', 'onBattery', 'offline', 'unavailable'] })
  status: 'online' | 'onBattery' | 'offline' | 'unavailable';

  @ApiProperty({ nullable: true })
  batteryLevel: number | null;

  @ApiProperty({ nullable: true })
  load: number | null;

  @ApiProperty({ nullable: true })
  runtime: number | null;

  @ApiProperty({ nullable: true })
  temperature: number | null;

  @ApiProperty({ nullable: true })
  lastTest: Date | null;

  @ApiProperty({ nullable: true })
  nextTest: Date | null;

  @ApiProperty({ default: true })
  isMocked: boolean;
}

export class UpsStatusSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  online: number;

  @ApiProperty()
  onBattery: number;

  @ApiProperty()
  offline: number;

  @ApiProperty()
  unavailable: number;

  @ApiProperty({ nullable: true })
  averageLoad: number | null;

  @ApiProperty({ default: true })
  isMocked: boolean;
}

export class UpsStatusResponseDto {
  @ApiProperty({ type: [UpsStatusDto] })
  ups: UpsStatusDto[];

  @ApiProperty({ type: UpsStatusSummaryDto })
  summary: UpsStatusSummaryDto;
}

export class WidgetDataQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['critical', 'warning', 'info'] })
  @IsOptional()
  @IsEnum(['critical', 'warning', 'info'])
  severity?: 'critical' | 'warning' | 'info';
}

export class ExportQueryDto extends WidgetDataQueryDto {
  @ApiProperty({ enum: ['csv', 'json', 'xlsx'] })
  @IsEnum(['csv', 'json', 'xlsx'])
  format: 'csv' | 'json' | 'xlsx';
}
