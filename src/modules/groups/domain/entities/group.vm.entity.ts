import { Entity, OneToMany, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from './group.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import type { GroupServer } from './group.server.entity';

@Entity('group_vm')
export class GroupVm extends Group {
  @ApiProperty({ type: () => Vm, isArray: true })
  @OneToMany(() => Vm, (vm) => vm.group)
  vms: Vm[];

  @ApiProperty()
  @Column()
  serverGroupId: string;

  @ApiProperty()
  @ManyToOne('GroupServer', 'vmGroups', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverGroupId' })
  serverGroup: GroupServer;
}
