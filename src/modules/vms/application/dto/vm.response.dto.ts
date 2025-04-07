import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';

export class VmResponseDto {
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
  os: string;

  @ApiProperty()
  @IsString()
  adminUrl: string;

  @ApiProperty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsNumber()
  priority: number;

  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty()
  @IsUUID()
  serverId: string;
}
