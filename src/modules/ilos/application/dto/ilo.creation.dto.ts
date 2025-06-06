import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IloCreationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly id?: string;

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
  @IsString()
  readonly login!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password!: string;
}
