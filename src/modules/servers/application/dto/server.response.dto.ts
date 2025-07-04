import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../domain/entities/server.entity';
import { IloResponseDto } from '../../../ilos/application/dto/ilo.response.dto';

export class ServerResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly state!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly type!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority!: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsUUID()
  readonly groupId?: string | null;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly upsId?: string;

  @ApiProperty({ type: IloResponseDto, required: false })
  @IsOptional()
  readonly ilo?: IloResponseDto;

  constructor(server: Server, ilo?: IloResponseDto) {
    this.id = server.id;
    this.name = server.name;
    this.state = server.state;
    this.grace_period_on = server.grace_period_on;
    this.grace_period_off = server.grace_period_off;
    this.ip = server.ip;
    this.type = server.type;
    this.priority = server.priority;
    this.groupId = server.groupId;
    this.roomId = server.roomId;
    this.upsId = server.upsId;
    this.ilo = ilo;
  }

  static fromEntity(s: Server): ServerResponseDto {
    return new ServerResponseDto(
      s,
      s.ilo ? new IloResponseDto(s.ilo) : undefined,
    );
  }
}
