import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

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
  @IsUUID()
  readonly roomId?: string;
}
