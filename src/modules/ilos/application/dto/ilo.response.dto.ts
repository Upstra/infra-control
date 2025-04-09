import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Ilo } from '../../domain/entities/ilo.entity';

export class IloResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  constructor(ilo: Ilo) {
    this.name = ilo.name;
    this.ip = ilo.ip;
  }
}
