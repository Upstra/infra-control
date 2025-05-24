import { VmUpdateDto } from '@/modules/vms/application/dto/vm.update.dto';
import { GroupServerDto } from '../../application/dto/group.server.dto';
import { GroupServer } from '../entities/group.server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupServerDomainService {
  createGroup(dto: GroupServerDto): GroupServer {
    const groupServer = new GroupServer();
    groupServer.name = dto.name;
    groupServer.priority = dto.priority;

    return groupServer;
  }

  updateVmEntity(vm: Vm, dto: VmUpdateDto): Vm {
    vm.name = dto.name ?? vm.name;
    vm.state = dto.state ?? vm.state;
    vm.grace_period_on = dto.grace_period_on ?? vm.grace_period_on;
    vm.grace_period_off = dto.grace_period_off ?? vm.grace_period_off;
    vm.os = dto.os ?? vm.os;
    vm.adminUrl = dto.adminUrl ?? vm.adminUrl;
    vm.ip = dto.ip ?? vm.ip;
    vm.login = dto.login ?? vm.login;
    vm.password = dto.password ?? vm.password;
    vm.priority = dto.priority ?? vm.priority;
    vm.serverId = dto.serverId ?? vm.serverId;
    vm.groupId = dto.groupId ?? vm.groupId;

    return vm;
  }
}
