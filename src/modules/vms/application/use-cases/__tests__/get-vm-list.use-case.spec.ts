import { GetVmListUseCase } from '../get-vm-list.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('GetVmListUseCase', () => {
  let repo: jest.Mocked<VmRepositoryInterface>;
  let useCase: GetVmListUseCase;

  beforeEach(() => {
    repo = { paginate: jest.fn() } as any;
    useCase = new GetVmListUseCase(repo);
  });

  it('should return paginated VMs', async () => {
    const vms = [createMockVm({ id: 'vm-1' })];
    repo.paginate.mockResolvedValue([vms, 1]);

    const result = await useCase.execute(2, 5);

    expect(repo.paginate).toHaveBeenCalledWith(2, 5);
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(2);
  });

  it('should handle empty list', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
