import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationPreferencesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  alerts: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  activities: boolean;
}

export class DashboardPreferenceResponseDto {
  @ApiProperty()
  defaultLayoutId?: string;

  @ApiProperty({ example: 30000 })
  refreshInterval: number;

  @ApiProperty({ enum: ['light', 'dark'], example: 'dark' })
  theme: 'light' | 'dark';

  @ApiProperty({ type: NotificationPreferencesDto })
  notifications: NotificationPreferencesDto;
}

export class UpdateDashboardPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultLayoutId?: string;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  refreshInterval?: number;

  @ApiPropertyOptional({ enum: ['light', 'dark'] })
  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';

  @ApiPropertyOptional({ type: NotificationPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;
}
