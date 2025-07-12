import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Ilo } from '../../domain/entities/ilo.entity';

export class IloResponseDto {
  @ApiProperty()
  @IsUUID()
  readonly id!: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly login!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  constructor(ilo: Ilo) {
    this.id = ilo.id;
    this.name = ilo.name;
    this.ip = ilo.ip;
    this.login = ilo.login;
    this.password = ilo.password;
  }
}
