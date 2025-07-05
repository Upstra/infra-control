import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePriorityDto {
  @ApiProperty({
    description: 'Priority level (1-999)',
    minimum: 1,
    maximum: 999,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(999)
  priority: number;
}
