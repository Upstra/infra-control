import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteMigrationPlanDto {
  @ApiProperty({
    description: 'Path to the YAML migration plan file',
    example: '/path/to/migration-plan.yml',
  })
  @IsString()
  @IsNotEmpty()
  planPath: string;
}

export class MigrationStatusResponseDto {
  @ApiProperty({
    description: 'Current migration state',
    enum: ['idle', 'in migration', 'migrated', 'restarting', 'failed'],
  })
  state: string;

  @ApiProperty({
    description: 'List of migration events',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        timestamp: { type: 'string' },
        vmName: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  events: any[];

  @ApiProperty({
    description: 'Current operation being performed',
    required: false,
  })
  @IsOptional()
  currentOperation?: string;

  @ApiProperty({
    description: 'Migration start time',
    required: false,
  })
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    description: 'Migration end time',
    required: false,
  })
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    description: 'Error message if migration failed',
    required: false,
  })
  @IsOptional()
  error?: string;
}