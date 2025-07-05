import { UpdateVmUseCase } from '../update-vm.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { VmDomainService } from '@/modules/vms/domain/services/vm.domain.service';
import { VmNotFoundException } from '@/modules/vms/domain/exceptions/vm.exception';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { VmUpdateDto } from '../../dto/vm.update.dto';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { GroupTypeMismatchException } from '@/modules/groups/domain/exceptions/group-type-mismatch.exception';
import { GroupType } from '@/modules/groups/domain/enums/group-type.enum';

describe('UpdateVmUseCase', () => {
  let useCase: UpdateVmUseCase;
  let repo: jest.Mocked<VmRepositoryInterface>;
  let domain: jest.Mocked<VmDomainService>;
  let groupRepo: jest.Mocked<GroupRepository>;

  beforeEach(() => {
    repo = {
      findVmById: jest.fn(),
      save: jest.fn(),
    } as any;

    domain = {
      updateVmEntity: jest.fn(),
    } as any;

    groupRepo = {
      findById: jest.fn(),
    } as any;

    useCase = new UpdateVmUseCase(repo, domain, groupRepo);
  });

  it('should update a VM and return the updated DTO', async () => {
    const mockVm = createMockVm({ id: 'vm-1', name: 'VM-Test' });
    const updateDto: VmUpdateDto = { name: 'Updated-VM' };
    const updatedVm = createMockVm({ id: 'vm-1', name: 'Updated-VM' });

    repo.findVmById.mockResolvedValue(mockVm);
    domain.updateVmEntity.mockReturnValue(updatedVm);
    repo.save.mockResolvedValue(updatedVm);

    const result = await useCase.execute('vm-1', updateDto);

    expect(result.name).toBe('Updated-VM');
    expect(repo.findVmById).toHaveBeenCalledWith('vm-1');
    expect(domain.updateVmEntity).toHaveBeenCalledWith(mockVm, updateDto);
    expect(repo.save).toHaveBeenCalledWith(updatedVm);
  });

  it('should throw VmNotFoundException if VM does not exist', async () => {
    repo.findVmById.mockImplementation(() => {
      throw new VmNotFoundException('vm-404');
    });

    await expect(useCase.execute('vm-404', {})).rejects.toThrow(
      VmNotFoundException,
    );
  });

  it('should update only the provided fields in partial update', async () => {
    const baseVm = createMockVm({ id: 'vm-2', state: 'UP' });
    const partialDto: VmUpdateDto = { state: 'DOWN' };
    const updatedVm = createMockVm({ id: 'vm-2', state: 'DOWN' });

    repo.findVmById.mockResolvedValue(baseVm);
    domain.updateVmEntity.mockReturnValue(updatedVm);
    repo.save.mockResolvedValue(updatedVm);

    const result = await useCase.execute('vm-2', partialDto);

    expect(result.state).toBe('DOWN');
    expect(domain.updateVmEntity).toHaveBeenCalledWith(baseVm, partialDto);
  });

  it('should allow assigning VM to a VM type group', async () => {
    const dto: VmUpdateDto = {
      groupId: 'vm-group-123',
    };
    const existing = createMockVm({ id: 'vm-1' });
    const updated = createMockVm({ id: 'vm-1', groupId: 'vm-group-123' });
    const vmGroup = {
      id: 'vm-group-123',
      type: GroupType.VM,
      name: 'VM Group',
    };

    repo.findVmById.mockResolvedValue(existing);
    groupRepo.findById.mockResolvedValue(vmGroup as any);
    domain.updateVmEntity.mockReturnValue(updated);
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('vm-1', dto);

    expect(groupRepo.findById).toHaveBeenCalledWith('vm-group-123');
    expect(result.groupId).toBe('vm-group-123');
  });

  it('should throw when trying to assign VM to a SERVER type group', async () => {
    const dto: VmUpdateDto = {
      groupId: 'server-group-123',
    };
    const existing = createMockVm({ id: 'vm-1' });
    const serverGroup = {
      id: 'server-group-123',
      type: GroupType.SERVER,
      name: 'Server Group',
    };

    repo.findVmById.mockResolvedValue(existing);
    groupRepo.findById.mockResolvedValue(serverGroup as any);

    await expect(useCase.execute('vm-1', dto)).rejects.toThrow(
      GroupTypeMismatchException,
    );
    expect(groupRepo.findById).toHaveBeenCalledWith('server-group-123');
  });

  it('should skip group validation when groupId is not provided', async () => {
    const dto: VmUpdateDto = {
      name: 'Updated',
    };
    const existing = createMockVm({ id: 'vm-1' });
    const updated = createMockVm({ id: 'vm-1', name: 'Updated' });

    repo.findVmById.mockResolvedValue(existing);
    domain.updateVmEntity.mockReturnValue(updated);
    repo.save.mockResolvedValue(updated);

    await useCase.execute('vm-1', dto);

    expect(groupRepo.findById).not.toHaveBeenCalled();
  });
});
