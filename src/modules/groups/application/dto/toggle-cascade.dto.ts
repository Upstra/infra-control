import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleCascadeDto {
  @ApiProperty()
  @IsBoolean()
  cascade: boolean;
}
