import { Injectable } from '@nestjs/common';
import { Vm } from '../entities/vm.entity';
import { VmCreationDto } from '../../application/dto/vm.creation.dto';
import { VmUpdateDto } from '../../application/dto/vm.update.dto';

@Injectable()
export class VmDomainService {
  createVmEntity(dto: VmCreationDto): Vm {
    const vm = new Vm();
    vm.name = dto.name;
    vm.state = dto.state;
    vm.grace_period_on = dto.grace_period_on;
    vm.grace_period_off = dto.grace_period_off;
    vm.os = dto.os;
    vm.adminUrl = dto.adminUrl;
    vm.ip = dto.ip;
    vm.login = dto.login;
    vm.password = dto.password;
    vm.priority = dto.priority;
    vm.serverId = dto.serverId;
    vm.groupId = dto.groupId;

    return vm;
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
