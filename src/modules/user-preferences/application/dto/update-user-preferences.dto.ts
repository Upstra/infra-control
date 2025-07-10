import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsEmail,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationsDto {
  @ApiProperty({ description: 'Enable server notifications', required: false })
  @IsOptional()
  @IsBoolean()
  server?: boolean;

  @ApiProperty({ description: 'Enable UPS notifications', required: false })
  @IsOptional()
  @IsBoolean()
  ups?: boolean;

  @ApiProperty({ description: 'Enable email notifications', required: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ description: 'Enable push notifications', required: false })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

export class UpdateDisplayDto {
  @ApiProperty({
    description: 'Default view for users',
    enum: ['table', 'card'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['table', 'card'])
  defaultUserView?: 'table' | 'card';

  @ApiProperty({
    description: 'Default view for servers',
    enum: ['grid', 'list'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['grid', 'list'])
  defaultServerView?: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for UPS',
    enum: ['grid', 'list'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['grid', 'list'])
  defaultUpsView?: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for rooms',
    enum: ['grid', 'list'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['grid', 'list'])
  defaultRoomView?: 'grid' | 'list';

  @ApiProperty({
    description: 'Default view for groups',
    enum: ['grid', 'list', 'sections', 'flow'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['grid', 'list', 'sections', 'flow'])
  defaultGroupView?: 'grid' | 'list' | 'sections' | 'flow';

  @ApiProperty({ description: 'Enable compact mode', required: false })
  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;
}

export class UpdateIntegrationsDto {
  @ApiProperty({ description: 'Slack webhook URL', required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  slackWebhook?: string;

  @ApiProperty({ description: 'Alert email address', required: false })
  @IsOptional()
  @IsEmail()
  alertEmail?: string;

  @ApiProperty({ description: 'Discord webhook URL', required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  discordWebhook?: string;

  @ApiProperty({ description: 'Teams webhook URL', required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  teamsWebhook?: string;
}

export class UpdatePerformanceDto {
  @ApiProperty({ description: 'Enable auto refresh', required: false })
  @IsOptional()
  @IsBoolean()
  autoRefresh?: boolean;

  @ApiProperty({
    description: 'Refresh interval in seconds',
    minimum: 15,
    maximum: 300,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(300)
  refreshInterval?: number;
}

export class UpdateUserPreferencesDto {
  @ApiProperty({
    description: 'User locale',
    enum: ['fr', 'en'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['fr', 'en'])
  locale?: 'fr' | 'en';

  @ApiProperty({
    description: 'UI theme',
    enum: ['light', 'dark'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';

  @ApiProperty({
    description: 'User timezone',
    example: 'Europe/Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ type: UpdateNotificationsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateNotificationsDto)
  notifications?: UpdateNotificationsDto;

  @ApiProperty({ type: UpdateDisplayDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDisplayDto)
  display?: UpdateDisplayDto;

  @ApiProperty({ type: UpdateIntegrationsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIntegrationsDto)
  integrations?: UpdateIntegrationsDto;

  @ApiProperty({ type: UpdatePerformanceDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePerformanceDto)
  performance?: UpdatePerformanceDto;
}
