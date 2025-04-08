import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class IloCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id!: string;

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
