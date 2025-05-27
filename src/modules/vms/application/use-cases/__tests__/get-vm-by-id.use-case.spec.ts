import { GetVmByIdUseCase } from '../get-vm-by-id.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { VmNotFoundException } from '@/modules/vms/domain/exceptions/vm.exception';

describe('GetVmByIdUseCase', () => {
  let useCase: GetVmByIdUseCase;
  let repo: jest.Mocked<VmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findVmById: jest.fn(),
    } as any;

    useCase = new GetVmByIdUseCase(repo);
  });

  it('should return a VM DTO when found', async () => {
    const mockVm = createMockVm({ id: 'vm-123' });
    repo.findVmById.mockResolvedValue(mockVm);

    const result = await useCase.execute('vm-123');

    expect(result).toMatchObject({ name: mockVm.name, ip: mockVm.ip });
    expect(repo.findVmById).toHaveBeenCalledWith('vm-123');
  });

  it('should throw VmNotFoundException if VM is not found', async () => {
    repo.findVmById.mockImplementation(() => {
      throw new VmNotFoundException('vm-404');
    });

    await expect(useCase.execute('vm-404')).rejects.toThrow(
      VmNotFoundException,
    );
    expect(repo.findVmById).toHaveBeenCalledWith('vm-404');
  });
});
