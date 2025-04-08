import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

export class VmResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly os: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly adminUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly groupId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly serverId: string;

  constructor(vm: Vm) {
    this.name = vm.name;
    this.state = vm.state;
    this.grace_period_on = vm.grace_period_on;
    this.grace_period_off = vm.grace_period_off;
    this.os = vm.os;
    this.adminUrl = vm.adminUrl;
    this.ip = vm.ip;
    this.priority = vm.priority;
    this.groupId = vm.groupId;
    this.serverId = vm.serverId;
  }
}
