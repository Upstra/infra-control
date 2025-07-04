import { Vm } from '../domain/entities/vm.entity';
import { Group } from '@/modules/groups/domain/entities/group.entity';
import { VmResponseDto } from '../application/dto/vm.response.dto';

export const createMockVm = (partial?: Partial<Vm>): Vm => {
  const vm = new Vm();
  vm.id = partial?.id || 'vm-123';
  vm.name = partial?.name || 'VM Test';
  vm.state = partial?.state || 'RUNNING';
  vm.grace_period_on = partial?.grace_period_on || 30;
  vm.grace_period_off = partial?.grace_period_off || 10;
  vm.os = partial?.os || 'Ubuntu 22.04';
  vm.adminUrl = partial?.adminUrl || 'https://admin.local';
  vm.ip = partial?.ip || '192.168.1.100';
  vm.login = partial?.login || 'admin';
  vm.password = partial?.password || 'password';
  vm.priority = partial?.priority || 1;
  vm.serverId = partial?.serverId || 'server-1';
  vm.server = partial?.server || undefined;
  vm.groupId = partial?.groupId || 'group-vm-1';
  vm.group = partial?.group || ({} as Group);
  vm.permissions = partial?.permissions || [];

  return vm;
};

export const createMockVmResponseDto = (
  partial?: Partial<Vm>,
): VmResponseDto => {
  const vm = createMockVm(partial);
  return new VmResponseDto(vm);
};
