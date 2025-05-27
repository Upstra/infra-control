import { GetAllVmsUseCase } from '../get-all-vms.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('GetAllVmsUseCase', () => {
  let useCase: GetAllVmsUseCase;
  let repo: jest.Mocked<VmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as any;

    useCase = new GetAllVmsUseCase(repo);
  });

  it('should return all VMs as DTOs', async () => {
    const vm1 = createMockVm({ id: 'vm-1' });
    const vm2 = createMockVm({ id: 'vm-2' });
    repo.findAll.mockResolvedValue([vm1, vm2]);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: vm1.name, ip: vm1.ip });
    expect(result[1]).toMatchObject({ name: vm2.name, ip: vm2.ip });
  });

  it('should return an empty array if no VMs exist', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
