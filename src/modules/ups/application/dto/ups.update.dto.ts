import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name?: string;

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
  readonly grace_period_on?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_off?: number;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly roomId?: string;
}
