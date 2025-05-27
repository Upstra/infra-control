import { UpdateVmUseCase } from '../update-vm.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { VmDomainService } from '@/modules/vms/domain/services/vm.domain.service';
import { VmNotFoundException } from '@/modules/vms/domain/exceptions/vm.exception';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { VmUpdateDto } from '../../dto/vm.update.dto';

describe('UpdateVmUseCase', () => {
  let useCase: UpdateVmUseCase;
  let repo: jest.Mocked<VmRepositoryInterface>;
  let domain: jest.Mocked<VmDomainService>;

  beforeEach(() => {
    repo = {
      findVmById: jest.fn(),
      save: jest.fn(),
    } as any;

    domain = {
      updateVmEntity: jest.fn(),
    } as any;

    useCase = new UpdateVmUseCase(repo, domain);
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
});
