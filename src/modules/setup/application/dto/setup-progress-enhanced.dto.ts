import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { SetupStep } from './setup-status.dto';

/**
 * Resource counts in the system
 */
export class ResourceCountsDto {
  @ApiProperty({
    description: 'Number of rooms in the system',
    example: 3,
  })
  @IsNumber()
  rooms: number;

  @ApiProperty({
    description: 'Number of UPS devices in the system',
    example: 5,
  })
  @IsNumber()
  ups: number;

  @ApiProperty({
    description: 'Number of servers in the system',
    example: 10,
  })
  @IsNumber()
  servers: number;
}

/**
 * Enhanced setup progress response DTO
 */
export class SetupProgressEnhancedDto {
  @ApiProperty({
    description: 'Current setup step',
    enum: SetupStep,
    example: SetupStep.ROOMS_CONFIG,
  })
  @IsEnum(SetupStep)
  currentStep: SetupStep;

  @ApiProperty({
    description: 'List of completed steps',
    type: [String],
    enum: SetupStep,
    example: [SetupStep.WELCOME, SetupStep.RESOURCE_PLANNING],
  })
  @IsEnum(SetupStep, { each: true })
  completedSteps: SetupStep[];

  @ApiProperty({
    description: 'Total number of steps',
    example: 8,
  })
  @IsNumber()
  totalSteps: number;

  @ApiProperty({
    description: 'Percentage of completion',
    example: 25,
  })
  @IsNumber()
  percentComplete: number;

  @ApiProperty({
    description: 'Current resource counts in the system',
    type: ResourceCountsDto,
  })
  @Type(() => ResourceCountsDto)
  resourceCounts: ResourceCountsDto;

  @ApiProperty({
    description: 'Last modification date',
    example: new Date(),
  })
  @IsDate()
  @Type(() => Date)
  lastModified: Date;

  @ApiProperty({
    description: 'Whether user can skip to review (if resources already exist)',
    example: false,
  })
  @IsBoolean()
  canSkipToReview: boolean;

  @ApiProperty({
    description: 'Whether setup is completed',
    example: false,
  })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
