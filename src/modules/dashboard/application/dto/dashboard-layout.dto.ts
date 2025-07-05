import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetType } from '../../domain/entities/dashboard-widget.entity';

export class WidgetPositionDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  y: number;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  @Max(12)
  w: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  h: number;
}

export class DashboardWidgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: WidgetType })
  @IsEnum(WidgetType)
  type: WidgetType;

  @ApiProperty({ example: 'System Statistics' })
  @IsString()
  title: string;

  @ApiProperty({ type: WidgetPositionDto })
  @ValidateNested()
  @Type(() => WidgetPositionDto)
  position: WidgetPositionDto;

  @ApiPropertyOptional({ example: { selectedStats: ['users', 'servers'] } })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  refreshInterval?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class CreateDashboardLayoutDto {
  @ApiProperty({ example: 'Operations Dashboard' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  columns?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  rowHeight?: number;

  @ApiPropertyOptional({ type: [DashboardWidgetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets?: DashboardWidgetDto[];
}

export class UpdateDashboardLayoutDto {
  @ApiPropertyOptional({ example: 'Updated Dashboard Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: [DashboardWidgetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets?: DashboardWidgetDto[];
}

export class DashboardLayoutResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  columns: number;

  @ApiProperty()
  rowHeight: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [DashboardWidgetDto] })
  widgets: DashboardWidgetDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DashboardLayoutListResponseDto {
  @ApiProperty({ type: [DashboardLayoutResponseDto] })
  layouts: DashboardLayoutResponseDto[];
}
