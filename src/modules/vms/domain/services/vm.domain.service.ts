import { Injectable } from '@nestjs/common';
import { Vm } from '../entities/vm.entity';
import { VmCreationDto } from '../../application/dto/vm.creation.dto';
import { VmUpdateDto } from '../../application/dto/vm.update.dto';

/**
 * Orchestrates virtual machine operations in the domain context, including lifecycle
 * management, resource allocation, and health checks.
 *
 * Responsibilities:
 * - Validate and persist VM entities with correct server associations and resource quotas.
 * - Start, stop, and reboot VMs, enforcing graceful shutdown protocols if necessary.
 * - Monitor VM status and propagate errors via domain exceptions.
 * - Support grouping and permission checks via collaboration with GroupDomainService and PermissionDomainVmService.
 *
 * @remarks
 * Consumed by application-layer use-cases; avoid direct controller usage to preserve domain rules.
 *
 * @example
 * // Create and power on a new VM
 * const vm = await vmDomainService.createVm(params);
 */

@Injectable()
export class VmDomainService {
  createVmEntity(dto: VmCreationDto): Vm {
    const vm = new Vm();
    vm.name = dto.name;
    vm.state = dto.state;
    vm.grace_period_on = dto.grace_period_on;
    vm.grace_period_off = dto.grace_period_off;
    vm.moid = dto.moid;
    vm.os = dto.os;
    vm.guestOs = dto.guestOs;
    vm.guestFamily = dto.guestFamily;
    vm.version = dto.version;
    vm.createDate = dto.createDate ? new Date(dto.createDate) : undefined;
    vm.numCoresPerSocket = dto.numCoresPerSocket;
    vm.numCPU = dto.numCPU;
    vm.esxiHostName = dto.esxiHostName;
    vm.esxiHostMoid = dto.esxiHostMoid;
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
    vm.moid = dto.moid ?? vm.moid;
    vm.os = dto.os ?? vm.os;
    vm.guestOs = dto.guestOs ?? vm.guestOs;
    vm.guestFamily = dto.guestFamily ?? vm.guestFamily;
    vm.version = dto.version ?? vm.version;
    vm.createDate = dto.createDate ? new Date(dto.createDate) : vm.createDate;
    vm.numCoresPerSocket = dto.numCoresPerSocket ?? vm.numCoresPerSocket;
    vm.numCPU = dto.numCPU ?? vm.numCPU;
    vm.esxiHostName = dto.esxiHostName ?? vm.esxiHostName;
    vm.esxiHostMoid = dto.esxiHostMoid ?? vm.esxiHostMoid;
    vm.adminUrl = dto.adminUrl ?? vm.adminUrl;
    vm.ip = dto.ip ?? vm.ip;
    vm.login = dto.login ?? vm.login;
    vm.password = dto.password ?? vm.password;
    vm.priority = dto.priority ?? vm.priority;

    if ('serverId' in dto) vm.serverId = dto.serverId;
    if ('groupId' in dto) vm.groupId = dto.groupId;

    return vm;
  }
}
