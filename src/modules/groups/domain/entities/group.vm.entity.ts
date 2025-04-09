import { Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from './group.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';

@Entity('group_vm')
export class GroupVm extends Group {
  @ApiProperty({ type: () => Vm, isArray: true })
  @OneToMany(() => Vm, (vm) => vm.group)
  vms: Vm[];
}
