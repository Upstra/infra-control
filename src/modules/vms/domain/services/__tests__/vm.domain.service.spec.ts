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
      moid: 'vm-123',
      os: 'Ubuntu',
      guestOs: 'ubuntu64Guest',
      guestFamily: 'linuxGuest',
      version: 'vmx-19',
      createDate: '2023-01-01T00:00:00Z',
      numCoresPerSocket: 2,
      numCPU: 4,
      esxiHostName: 'esxi-host-01',
      esxiHostMoid: 'host-123',
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
    expect(vm.moid).toBe(dto.moid);
    expect(vm.os).toBe(dto.os);
    expect(vm.guestOs).toBe(dto.guestOs);
    expect(vm.guestFamily).toBe(dto.guestFamily);
    expect(vm.version).toBe(dto.version);
    expect(vm.createDate).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(vm.numCoresPerSocket).toBe(dto.numCoresPerSocket);
    expect(vm.numCPU).toBe(dto.numCPU);
    expect(vm.esxiHostName).toBe(dto.esxiHostName);
    expect(vm.esxiHostMoid).toBe(dto.esxiHostMoid);
    expect(vm.serverId).toBe(dto.serverId);
    expect(vm.groupId).toBe(dto.groupId);
  });

  it('should update a Vm entity from update DTO', () => {
    const existingVm = Object.assign(new Vm(), {
      name: 'OldName',
      state: 'DOWN',
      moid: 'vm-old',
      os: 'Debian',
      guestOs: 'debian64Guest',
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
      moid: 'vm-updated',
      guestOs: 'ubuntu64Guest',
      ip: '192.168.1.101',
    };

    const updated = service.updateVmEntity(existingVm, dto);

    expect(updated.name).toBe('UpdatedVM');
    expect(updated.moid).toBe('vm-updated');
    expect(updated.guestOs).toBe('ubuntu64Guest');
    expect(updated.ip).toBe('192.168.1.101');
    expect(updated.state).toBe('DOWN');
    expect(updated.os).toBe('Debian');
  });

  it('should create VM entity with MOID from discovery', () => {
    const dto: VmCreationDto = {
      name: 'discovered-vm',
      state: 'powered_on',
      grace_period_on: 30,
      grace_period_off: 60,
      moid: 'vm-discovery-123',
      os: 'Ubuntu 22.04',
      guestOs: 'ubuntu64Guest',
      guestFamily: 'linuxGuest',
      version: 'vmx-19',
      priority: 1,
      serverId: crypto.randomUUID(),
    };

    const vm = service.createVmEntity(dto);

    expect(vm.moid).toBe('vm-discovery-123');
    expect(vm.name).toBe('discovered-vm');
    expect(vm.state).toBe('powered_on');
    expect(vm.guestOs).toBe('ubuntu64Guest');
    expect(vm.guestFamily).toBe('linuxGuest');
    expect(vm.version).toBe('vmx-19');
  });

  it('should preserve existing MOID when updating without MOID change', () => {
    const existingVm = Object.assign(new Vm(), {
      name: 'existing-vm',
      moid: 'vm-existing-123',
      state: 'powered_on',
      priority: 1,
    });

    const dto: VmUpdateDto = {
      name: 'updated-vm-name',
      state: 'powered_off',
    };

    const updated = service.updateVmEntity(existingVm, dto);

    expect(updated.moid).toBe('vm-existing-123');
    expect(updated.name).toBe('updated-vm-name');
    expect(updated.state).toBe('powered_off');
  });
});
