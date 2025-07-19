import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../domain/entities/server.entity';
import { IloResponseDto } from '../../../ilos/application/dto/ilo.response.dto';
import { ServerMetricsExtendedDto } from './server-metrics-extended.dto';

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
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly type!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly adminUrl!: string;

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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly login!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly password?: string;

  @ApiProperty({ type: IloResponseDto, required: false })
  @IsOptional()
  readonly ilo?: IloResponseDto;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsUUID()
  readonly iloId?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly vmwareHostMoid?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly createdAt!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly updatedAt!: string;

  @ApiProperty({ type: ServerMetricsExtendedDto, required: false })
  @IsOptional()
  readonly metrics?: ServerMetricsExtendedDto;

  constructor(server: Server, ilo?: IloResponseDto) {
    this.id = server.id;
    this.name = server.name;
    this.state = server.state;
    this.ip = server.ip;
    this.type = server.type;
    this.adminUrl = server.adminUrl;
    this.priority = server.priority;
    this.groupId = server.groupId;
    this.roomId = server.roomId;
    this.upsId = server.upsId;
    this.login = server.login;
    this.password = server.password;
    this.ilo = ilo;
    this.iloId = server.iloId;
    this.vmwareHostMoid = server.vmwareHostMoid;
    this.createdAt = server.createdAt?.toISOString();
    this.updatedAt = server.updatedAt?.toISOString();
  }

  static fromEntity(s: Server): ServerResponseDto {
    return new ServerResponseDto(
      s,
      s.ilo ? new IloResponseDto(s.ilo) : undefined,
    );
  }
}
