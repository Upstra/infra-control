import { DeleteVmUseCase } from '../delete-vm.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('DeleteVmUseCase', () => {
  let useCase: DeleteVmUseCase;
  let repo: jest.Mocked<VmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findVmById: jest.fn(),
      deleteVm: jest.fn(),
    } as any;

    useCase = new DeleteVmUseCase(repo);
  });

  it('should delete vm when it exists', async () => {
    repo.findVmById.mockResolvedValue(createMockVm());
    repo.deleteVm.mockResolvedValue(undefined);

    await expect(useCase.execute('vm-id')).resolves.toBeUndefined();
    expect(repo.findVmById).toHaveBeenCalledWith('vm-id');
    expect(repo.deleteVm).toHaveBeenCalledWith('vm-id');
  });

  it('should throw if vm does not exist', async () => {
    repo.findVmById.mockRejectedValue(new Error('VM not found'));

    await expect(useCase.execute('bad-id')).rejects.toThrow('VM not found');
    expect(repo.findVmById).toHaveBeenCalledWith('bad-id');
    expect(repo.deleteVm).not.toHaveBeenCalled();
  });
});
