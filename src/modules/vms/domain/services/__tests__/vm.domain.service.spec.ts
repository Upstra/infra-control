import { VmCreationDto } from '@/modules/vms/application/dto/vm.creation.dto';
import { VmDomainService } from '../vm.domain.service';
import { Vm } from '../../entities/vm.entity';
import { VmUpdateDto } from '@/modules/vms/application/dto/vm.update.dto';

describe('VmDomainService', () => {
  let service: VmDomainService;

  beforeEach(() => {
    service = new VmDomainService();
  });

  it('should create a Vm entity from creation DTO', () => {
    const dto: VmCreationDto = {
      name: 'VM-1',
      state: 'UP',
      grace_period_on: 30,
      grace_period_off: 30,
      os: 'Ubuntu',
      adminUrl: 'https://admin.local',
      ip: '192.168.1.10',
      login: 'admin',
      password: 'secret',
      priority: 1,
      serverId: crypto.randomUUID(),
      groupId: crypto.randomUUID(),
    };

    const vm = service.createVmEntity(dto);

    expect(vm).toBeInstanceOf(Vm);
    expect(vm.name).toBe(dto.name);
    expect(vm.state).toBe(dto.state);
    expect(vm.os).toBe(dto.os);
    expect(vm.serverId).toBe(dto.serverId);
    expect(vm.groupId).toBe(dto.groupId);
  });

  it('should update a Vm entity from update DTO', () => {
    const existingVm = Object.assign(new Vm(), {
      name: 'OldName',
      state: 'DOWN',
      os: 'Debian',
      adminUrl: 'https://old.local',
      ip: '192.168.1.100',
      login: 'root',
      password: 'oldpass',
      priority: 5,
      serverId: 'old-server-id',
      groupId: 'old-group-id',
    });

    const dto: VmUpdateDto = {
      name: 'UpdatedVM',
      ip: '192.168.1.101',
    };

    const updated = service.updateVmEntity(existingVm, dto);

    expect(updated.name).toBe('UpdatedVM');
    expect(updated.ip).toBe('192.168.1.101');
    expect(updated.state).toBe('DOWN');
  });
});
