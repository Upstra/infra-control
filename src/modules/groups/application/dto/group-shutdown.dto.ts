import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GroupShutdownDto {
  @ApiProperty({
    description: 'Grace period in seconds before shutdown',
    required: false,
    default: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriod?: number;

  @ApiProperty({
    description: 'Force shutdown even if some resources fail',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
