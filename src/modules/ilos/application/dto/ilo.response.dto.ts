import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class IloResponseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  ip: string;
}
