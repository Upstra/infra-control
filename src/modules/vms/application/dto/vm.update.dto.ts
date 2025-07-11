import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsUUID, IsDateString, IsInt } from 'class-validator';

export class VmUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly moid?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly state?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_on?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_off?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly os?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly guestOs?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly guestFamily?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly version?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  readonly createDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  readonly numCoresPerSocket?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  readonly numCPU?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly esxiHostName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly esxiHostMoid?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly adminUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly ip?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly login?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly password?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly priority?: number;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly serverId?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly groupId?: string;
}
