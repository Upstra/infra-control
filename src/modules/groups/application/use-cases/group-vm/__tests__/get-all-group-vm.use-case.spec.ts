import { GetAllGroupVmUseCase } from '../get-all-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';

describe('GetAllGroupVmUseCase', () => {
  let useCase: GetAllGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as any;

    useCase = new GetAllGroupVmUseCase(repo);
  });

  it('should return all GroupVm as DTOs', async () => {
    const mockGroups = [
      createMockGroupVm({
        id: 'groupvm-1',
        name: 'Group 1',
        priority: 2,
        vms: [],
      }),
      createMockGroupVm({
        id: 'groupvm-2',
        name: 'Group 2',
        priority: 5,
        vms: [],
      }),
    ];
    repo.findAll.mockResolvedValue(mockGroups);

    const result = await useCase.execute();

    expect(repo.findAll).toHaveBeenCalled();

    const minimalResult = result.map((dto) => ({
      name: dto.name,
      priority: dto.priority,
      vmIds: dto.vmIds,
    }));

    expect(minimalResult).toEqual([
      {
        name: 'Group 1',
        priority: 2,
        vmIds: [],
      },
      {
        name: 'Group 2',
        priority: 5,
        vmIds: [],
      },
    ]);
  });

  it('should return empty array if no groups', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
