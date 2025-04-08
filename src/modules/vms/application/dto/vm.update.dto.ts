import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsUUID } from 'class-validator';

export class VmUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name?: string;

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
