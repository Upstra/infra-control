import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Vm } from '../../domain/entities/vm.entity';

export class VmResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly moid?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly state: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly os?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly guestOs?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly guestFamily?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly version?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsDateString()
  readonly createDate?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsInt()
  readonly numCoresPerSocket?: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsInt()
  readonly numCPU?: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly esxiHostName?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly esxiHostMoid?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly adminUrl?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  readonly ip?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsUUID()
  readonly groupId?: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsUUID()
  readonly serverId?: string | null;

  constructor(vm: Vm) {
    this.id = vm.id;
    this.name = vm.name;
    this.moid = vm.moid;
    this.state = vm.state;
    this.grace_period_on = vm.grace_period_on;
    this.grace_period_off = vm.grace_period_off;
    this.os = vm.os;
    this.guestOs = vm.guestOs;
    this.guestFamily = vm.guestFamily;
    this.version = vm.version;
    this.createDate = vm.createDate?.toISOString();
    this.numCoresPerSocket = vm.numCoresPerSocket;
    this.numCPU = vm.numCPU;
    this.esxiHostName = vm.esxiHostName;
    this.esxiHostMoid = vm.esxiHostMoid;
    this.adminUrl = vm.adminUrl;
    this.ip = vm.ip;
    this.priority = vm.priority;
    this.groupId = vm.groupId;
    this.serverId = vm.serverId;
  }
}
