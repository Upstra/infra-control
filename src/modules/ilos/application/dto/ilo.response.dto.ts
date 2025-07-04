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
  readonly ip!: string;

  constructor(ilo: Ilo) {
    this.id = ilo.id;
    this.name = ilo.name;
    this.ip = ilo.ip;
  }
}
