import { UpdateGroupVmUseCase } from '../update-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';
import { GroupVmDto } from '../../../dto/group.vm.dto';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

describe('UpdateGroupVmUseCase', () => {
  let useCase: UpdateGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;
  let vmRepo: jest.Mocked<VmRepositoryInterface>;
  let domain: jest.Mocked<GroupVmDomainService>;

  beforeEach(() => {
    repo = {
      findGroupById: jest.fn(),
      save: jest.fn(),
    } as any;

    vmRepo = {
      findVmById: jest.fn(),
    } as any;

    domain = {
      updateGroupEntityFromDto: jest.fn(),
    } as any;

    useCase = new UpdateGroupVmUseCase(repo, vmRepo, domain);
  });

  it('should update the group with new values and return DTO', async () => {
    const existing = createMockGroupVm();
    const inputDto: GroupVmDto = {
      name: 'NewName',
      priority: 5,
      serverGroupId: 'server-group-789',
    };
    const updatedEntity = createMockGroupVm({ name: 'NewName', priority: 5 });

    repo.findGroupById.mockResolvedValue(existing);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      entity.name = dto.name;
      entity.priority = dto.priority;
      return entity;
    });
    repo.save.mockResolvedValue(updatedEntity);

    const result = await useCase.execute('groupvm-1', inputDto);

    expect(repo.findGroupById).toHaveBeenCalledWith('groupvm-1');
    expect(domain.updateGroupEntityFromDto).toHaveBeenCalledWith(
      existing,
      inputDto,
    );
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(result).toEqual(new GroupVmDto(updatedEntity));
  });

  it('should throw if the group does not exist', async () => {
    repo.findGroupById.mockResolvedValue(null);

    await expect(
      useCase.execute('notfound-id', {
        name: 'irrelevant',
        serverGroupId: 'server-group-999',
      } as GroupVmDto),
    ).rejects.toThrow(GroupNotFoundException);
  });

  it('should update VMs when vmIds are provided', async () => {
    const existing = createMockGroupVm();
    existing.vms = [];

    const vm1 = new Vm();
    vm1.id = 'vm-1';
    vm1.name = 'vm1';

    const vm2 = new Vm();
    vm2.id = 'vm-2';
    vm2.name = 'vm2';

    const inputDto: GroupVmDto = {
      name: 'UpdatedName',
      priority: 3,
      vmIds: ['vm-1', 'vm-2'],
    };

    const updatedEntity = createMockGroupVm({
      name: 'UpdatedName',
      priority: 3,
      vms: [vm1, vm2],
    });

    repo.findGroupById.mockResolvedValue(existing);
    domain.updateGroupEntityFromDto.mockReturnValue(existing);
    vmRepo.findVmById.mockImplementation((id) => {
      if (id === 'vm-1') return Promise.resolve(vm1);
      if (id === 'vm-2') return Promise.resolve(vm2);
      return Promise.resolve(null);
    });
    repo.save.mockResolvedValue(updatedEntity);

    const result = await useCase.execute('groupvm-1', inputDto);

    expect(vmRepo.findVmById).toHaveBeenCalledWith('vm-1');
    expect(vmRepo.findVmById).toHaveBeenCalledWith('vm-2');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        vms: [vm1, vm2],
      }),
    );
    expect(result.vmIds).toEqual(['vm-1', 'vm-2']);
  });

  it('should handle all fields from DTO', async () => {
    const existing = createMockGroupVm();
    const inputDto: GroupVmDto = {
      name: 'Complete Update',
      priority: 4,
      description: 'Updated description',
      cascade: false,
      roomId: 'room-456',
      serverGroupId: 'server-789',
      vmIds: [],
    };

    const updatedEntity = createMockGroupVm({
      ...inputDto,
      vms: [],
    });

    repo.findGroupById.mockResolvedValue(existing);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      Object.assign(entity, dto);
      return entity;
    });
    repo.save.mockResolvedValue(updatedEntity);

    const result = await useCase.execute('groupvm-1', inputDto);

    expect(domain.updateGroupEntityFromDto).toHaveBeenCalledWith(
      existing,
      inputDto,
    );
    expect(result).toEqual(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        description: inputDto.description,
        cascade: inputDto.cascade,
        roomId: inputDto.roomId,
        serverGroupId: inputDto.serverGroupId,
        vmIds: [],
      }),
    );
  });

  it('should only update provided fields', async () => {
    const existing = createMockGroupVm({
      name: 'Original Name',
      priority: 1,
      description: 'Original Description',
      cascade: true,
      roomId: 'room-123',
      serverGroupId: 'server-123',
    });

    const inputDto: GroupVmDto = {
      priority: 2,
    };

    repo.findGroupById.mockResolvedValue(existing);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      if (dto.priority !== undefined) entity.priority = dto.priority;
      return entity;
    });
    repo.save.mockResolvedValue(existing);

    await useCase.execute('groupvm-1', inputDto);

    expect(domain.updateGroupEntityFromDto).toHaveBeenCalledWith(
      existing,
      inputDto,
    );
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Original Name',
        priority: 2,
        description: 'Original Description',
        cascade: true,
        roomId: 'room-123',
        serverGroupId: 'server-123',
      }),
    );
  });
});
