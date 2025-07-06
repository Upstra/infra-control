import { ApiProperty } from '@nestjs/swagger';

export class ActivityTrendDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-01-01',
  })
  date: string;

  @ApiProperty({
    description: 'Number of events on this date',
    example: 234,
  })
  count: number;
}

export class TopUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Username',
    example: 'john.doe',
  })
  username: string;

  @ApiProperty({
    description: 'Number of events by this user',
    example: 543,
  })
  count: number;
}

export class HistoryStatsResponseDto {
  @ApiProperty({
    description: 'Total number of history events',
    example: 15234,
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Event count grouped by entity type',
    example: {
      server: 5432,
      ups: 3210,
      room: 2156,
    },
  })
  eventsByEntity: Record<string, number>;

  @ApiProperty({
    description: 'Event count grouped by action type',
    example: {
      create: 4532,
      update: 8765,
      delete: 1937,
    },
  })
  eventsByAction: Record<string, number>;

  @ApiProperty({
    description: 'Daily activity trends for the last 30 days',
    type: [ActivityTrendDto],
  })
  activityTrends: ActivityTrendDto[];

  @ApiProperty({
    description: 'Top 10 most active users',
    type: [TopUserDto],
  })
  topUsers: TopUserDto[];
}
