import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class IloUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly id?: string;

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
}
