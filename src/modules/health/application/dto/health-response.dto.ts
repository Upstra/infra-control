import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({
    description: 'Name of the health check',
    example: 'database',
  })
  name: string;

  @ApiProperty({
    description: 'Status of the health check',
    enum: ['up', 'down', 'unknown'],
    example: 'up',
  })
  status: 'up' | 'down' | 'unknown';

  @ApiProperty({
    description: 'Human readable message',
    example: 'Database connection is healthy',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 25,
    required: false,
  })
  responseTime?: number;

  @ApiProperty({
    description: 'Additional details about the health check',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, any>;
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Overall health status',
    enum: ['up', 'down', 'degraded'],
    example: 'up',
  })
  status: 'up' | 'down' | 'degraded';

  @ApiProperty({
    description: 'Timestamp of the health check',
    example: '2024-07-03T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Total response time for all checks',
    example: 150,
  })
  totalResponseTime: number;

  @ApiProperty({
    description: 'Individual health check results',
    type: [HealthCheckDto],
  })
  checks: HealthCheckDto[];

  @ApiProperty({
    description: 'Summary of health check results',
    type: 'object',
    additionalProperties: true,
  })
  summary: {
    total: number;
    up: number;
    down: number;
    unknown: number;
  };
}
