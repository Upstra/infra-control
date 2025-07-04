import { Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Group } from './group.entity';
import type { GroupVm } from './group.vm.entity';

@Entity('group_server')
export class GroupServer extends Group {
  @ApiProperty({ type: () => Server, isArray: true })
  @OneToMany(() => Server, (server) => server.group)
  servers: Server[];

  @ApiProperty({ isArray: true })
  @OneToMany('GroupVm', 'serverGroup')
  vmGroups: GroupVm[];
}
