import { ApiProperty } from '@nestjs/swagger';

export class NotificationsDto {
  @ApiProperty({ description: 'Enable server notifications' })
  server: boolean;

  @ApiProperty({ description: 'Enable UPS notifications' })
  ups: boolean;

  @ApiProperty({ description: 'Enable email notifications' })
  email: boolean;

  @ApiProperty({ description: 'Enable push notifications' })
  push: boolean;
}

export class DisplayDto {
  @ApiProperty({
    description: 'Default view for users',
    enum: ['table', 'card'],
  })
  defaultUserView: 'table' | 'card';

  @ApiProperty({
    description: 'Default view for servers',
    enum: ['grid', 'list'],
  })
  defaultServerView: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for UPS',
    enum: ['grid', 'list'],
  })
  defaultUpsView: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for rooms',
    enum: ['grid', 'list'],
  })
  defaultRoomView: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for groups',
    enum: ['grid', 'list', 'sections', 'flow'],
  })
  defaultGroupView: 'grid' | 'list' | 'sections' | 'flow';

  @ApiProperty({ description: 'Enable compact mode' })
  compactMode: boolean;
}

export class IntegrationsDto {
  @ApiProperty({ description: 'Slack webhook URL', required: false })
  slackWebhook?: string;

  @ApiProperty({ description: 'Alert email address', required: false })
  alertEmail?: string;

  @ApiProperty({ description: 'Discord webhook URL', required: false })
  discordWebhook?: string;

  @ApiProperty({ description: 'Teams webhook URL', required: false })
  teamsWebhook?: string;
}

export class PerformanceDto {
  @ApiProperty({ description: 'Enable auto refresh' })
  autoRefresh: boolean;

  @ApiProperty({
    description: 'Refresh interval in seconds',
    minimum: 15,
    maximum: 300,
  })
  refreshInterval: number;
}

export class UserPreferencesResponseDto {
  @ApiProperty({ description: 'User preferences ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({
    description: 'User locale',
    enum: ['fr', 'en'],
  })
  locale: 'fr' | 'en';

  @ApiProperty({
    description: 'UI theme',
    enum: ['light', 'dark'],
  })
  theme: 'light' | 'dark';

  @ApiProperty({
    description: 'User timezone',
    example: 'Europe/Paris',
  })
  timezone: string;

  @ApiProperty({ type: NotificationsDto })
  notifications: NotificationsDto;

  @ApiProperty({ type: DisplayDto })
  display: DisplayDto;

  @ApiProperty({ type: IntegrationsDto })
  integrations: IntegrationsDto;

  @ApiProperty({ type: PerformanceDto })
  performance: PerformanceDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
