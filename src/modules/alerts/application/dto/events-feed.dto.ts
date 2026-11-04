import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class EventsFeedQueryDto {
  @ApiPropertyOptional({ example: '2026-11-04T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-05T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 30;

  @ApiPropertyOptional({ description: 'Opaque cursor from nextCursor' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class FeedResourceDto {
  @ApiProperty({ example: 'ups' })
  type: string;

  @ApiProperty({ type: String, nullable: true })
  id: string | null;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;
}

export class FeedActorDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, nullable: true })
  username: string | null;
}

export class FeedItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['alert', 'action'] })
  kind: 'alert' | 'action';

  @ApiProperty({ enum: ['critical', 'warning', 'info'] })
  tone: 'critical' | 'warning' | 'info';

  @ApiProperty({ example: 'opened' })
  event: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: FeedResourceDto })
  resource: FeedResourceDto;

  @ApiProperty()
  at: Date;

  @ApiProperty({ type: FeedActorDto, nullable: true })
  by: FeedActorDto | null;

  @ApiProperty({ type: String, nullable: true })
  alertId: string | null;
}

export class EventsFeedResponseDto {
  @ApiProperty({ type: [FeedItemDto] })
  items: FeedItemDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;
}
