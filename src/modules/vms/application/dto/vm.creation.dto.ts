import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly moid?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly os?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly guestOs?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly guestFamily?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly version?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  readonly createDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  readonly numCoresPerSocket?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  readonly numCPU?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly esxiHostName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly esxiHostMoid?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly adminUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly ip?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly login?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly password?: string;

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
