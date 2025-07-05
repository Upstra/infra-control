import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePriorityDto {
  @ApiProperty({
    description: 'Priority level (1-4)',
    minimum: 1,
    maximum: 4,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(4)
  priority: number;
}