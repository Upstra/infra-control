import { CreateGroupVmUseCase } from '../create-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';
import { GroupVmDto } from '../../../dto/group.vm.dto';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

describe('CreateGroupVmUseCase', () => {
  let useCase: CreateGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;
  let vmRepo: jest.Mocked<VmRepositoryInterface>;
  let domain: jest.Mocked<GroupVmDomainService>;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
    } as any;

    vmRepo = {
      findVmById: jest.fn(),
    } as any;

    domain = {
      createGroup: jest.fn(),
    } as any;

    useCase = new CreateGroupVmUseCase(repo, vmRepo, domain);
  });

  it('should create a GroupVm and return the DTO', async () => {
    const inputDto: GroupVmDto = {
      name: 'Group VM Test',
      priority: 1,
      serverGroupId: 'server-group-123',
    };

    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    const createdEntity = Object.assign(new GroupVm(), entity, {
      id: 'group-123',
    });

    domain.createGroup.mockReturnValue(entity);
    repo.save.mockResolvedValue(createdEntity);

    const result = await useCase.execute(inputDto);

    expect(domain.createGroup).toHaveBeenCalledWith(inputDto);
    expect(repo.save).toHaveBeenCalledWith(entity);

    expect(result).toEqual(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        vmIds: [],
      }),
    );
  });

  it('should create a GroupVm with VMs and return the DTO', async () => {
    const inputDto: GroupVmDto = {
      name: 'Group VM with VMs',
      priority: 1,
      serverGroupId: 'server-group-123',
      vmIds: ['vm-1', 'vm-2'],
    };

    const vm1 = new Vm();
    vm1.id = 'vm-1';
    vm1.name = 'vm1';

    const vm2 = new Vm();
    vm2.id = 'vm-2';
    vm2.name = 'vm2';

    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    const createdEntity = Object.assign(new GroupVm(), entity, {
      id: 'group-123',
      vms: [vm1, vm2],
    });

    domain.createGroup.mockReturnValue(entity);
    vmRepo.findVmById.mockImplementation((id) => {
      if (id === 'vm-1') return Promise.resolve(vm1);
      if (id === 'vm-2') return Promise.resolve(vm2);
      return Promise.resolve(null);
    });
    repo.save.mockResolvedValue(createdEntity);

    const result = await useCase.execute(inputDto);

    expect(domain.createGroup).toHaveBeenCalledWith(inputDto);
    expect(vmRepo.findVmById).toHaveBeenCalledWith('vm-1');
    expect(vmRepo.findVmById).toHaveBeenCalledWith('vm-2');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        vms: [vm1, vm2],
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        vmIds: ['vm-1', 'vm-2'],
      }),
    );
  });

  it('should filter out non-existent VMs', async () => {
    const inputDto: GroupVmDto = {
      name: 'Group VM with invalid VMs',
      priority: 1,
      serverGroupId: 'server-group-123',
      vmIds: ['vm-1', 'invalid-vm'],
    };

    const vm1 = new Vm();
    vm1.id = 'vm-1';
    vm1.name = 'vm1';

    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    const createdEntity = Object.assign(new GroupVm(), entity, {
      id: 'group-123',
      vms: [vm1],
    });

    domain.createGroup.mockReturnValue(entity);
    vmRepo.findVmById.mockImplementation((id) => {
      if (id === 'vm-1') return Promise.resolve(vm1);
      return Promise.resolve(null);
    });
    repo.save.mockResolvedValue(createdEntity);

    const result = await useCase.execute(inputDto);

    expect(vmRepo.findVmById).toHaveBeenCalledWith('vm-1');
    expect(vmRepo.findVmById).toHaveBeenCalledWith('invalid-vm');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        vms: [vm1],
      }),
    );

    expect(result.vmIds).toEqual(['vm-1']);
  });

  it('should throw if repo.save throws', async () => {
    const inputDto: GroupVmDto = {
      name: 'fail',
      priority: 2,
      serverGroupId: 'server-group-456',
    };
    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    domain.createGroup.mockReturnValue(entity);
    repo.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(inputDto)).rejects.toThrow('DB Error');
  });

  it('should handle all fields from DTO correctly', async () => {
    const inputDto: GroupVmDto = {
      name: 'Complete Group',
      priority: 3,
      description: 'A complete group with all fields',
      cascade: false,
      roomId: 'room-123',
      serverGroupId: 'server-group-789',
      vmIds: [],
    };

    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.description = inputDto.description;
    entity.cascade = false;
    entity.roomId = inputDto.roomId;
    entity.serverGroupId = inputDto.serverGroupId;
    entity.vms = [];

    const createdEntity = Object.assign(new GroupVm(), entity, {
      id: 'group-complete',
    });

    domain.createGroup.mockReturnValue(entity);
    repo.save.mockResolvedValue(createdEntity);

    const result = await useCase.execute(inputDto);

    expect(domain.createGroup).toHaveBeenCalledWith(inputDto);
    expect(repo.save).toHaveBeenCalledWith(entity);

    expect(result).toEqual(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        description: inputDto.description,
        cascade: false,
        roomId: inputDto.roomId,
        serverGroupId: inputDto.serverGroupId,
        vmIds: [],
      }),
    );
  });
});
