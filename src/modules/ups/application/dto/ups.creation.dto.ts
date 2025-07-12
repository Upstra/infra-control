import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpsCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId!: string;
}
