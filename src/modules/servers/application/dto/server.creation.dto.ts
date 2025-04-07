import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServerCreationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsNumber()
  grace_period_on: number;

  @ApiProperty()
  @IsNumber()
  grace_period_off: number;

  @ApiProperty()
  @IsString()
  adminUrl: string;

  @ApiProperty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  priority: number;

  @ApiProperty()
  @IsNumber()
  roomId: number;
}
