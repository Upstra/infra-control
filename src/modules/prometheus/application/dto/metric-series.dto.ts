import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { METRIC_CATALOG, RANGE_SETTINGS } from '../../domain/metric-catalog';

export class MetricSeriesQueryDto {
  @ApiProperty({ enum: Object.keys(METRIC_CATALOG), example: 'total_power' })
  @IsIn(Object.keys(METRIC_CATALOG))
  metric: string;

  @ApiProperty({ enum: ['total', 'ups', 'server', 'host'], example: 'total' })
  @IsIn(['total', 'ups', 'server', 'host'])
  scope: 'total' | 'ups' | 'server' | 'host';

  @ApiPropertyOptional({ description: 'UPS or server uuid, or ESXi host moid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: Object.keys(RANGE_SETTINGS), example: '1h' })
  @IsIn(Object.keys(RANGE_SETTINGS))
  range: '1h' | '24h' | '7d';
}

export class MetricSeriesDto {
  @ApiProperty({ example: 'UPS-B2' })
  label: string;

  @ApiProperty({ example: [[1762286400000, 1830]] })
  points: Array<[number, number]>;
}

export class MetricSeriesResponseDto {
  @ApiProperty()
  metric: string;

  @ApiProperty({ example: 'W' })
  unit: string;

  @ApiProperty({ example: '1h' })
  range: string;

  @ApiProperty({ description: 'Step in seconds', example: 15 })
  step: number;

  @ApiProperty({ type: [MetricSeriesDto] })
  series: MetricSeriesDto[];
}
