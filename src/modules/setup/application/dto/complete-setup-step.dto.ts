import { ApiProperty } from '@nestjs/swagger';
import { SetupStep } from './setup-status.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class CompleteSetupStepDto {
  @ApiProperty({ enum: SetupStep })
  @IsEnum(SetupStep)
  step: SetupStep;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
