import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class UpsCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly login: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId: string;
}
