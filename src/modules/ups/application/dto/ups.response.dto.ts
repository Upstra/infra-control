import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UpsResponseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsNumber()
  grace_period_on: number;

  @ApiProperty()
  @IsNumber()
  grace_period_off: number;
}
