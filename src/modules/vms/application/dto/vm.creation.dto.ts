import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class VmCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly state!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly os!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly adminUrl!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly login!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly serverId!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly groupId?: string;
}
