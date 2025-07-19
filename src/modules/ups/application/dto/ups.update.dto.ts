import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

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
