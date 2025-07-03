import { GetAllGroupVmUseCase } from '../get-all-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';
import { GroupVmListResponseDto } from '../../../dto/group.vm.list.response.dto';

describe('GetAllGroupVmUseCase', () => {
  let useCase: GetAllGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
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
    repo.findAllPaginated.mockResolvedValue([mockGroups, mockGroups.length]);

    const result = await useCase.execute();

    expect(repo.findAllPaginated).toHaveBeenCalledWith(1, 10);
    expect(result).toBeInstanceOf(GroupVmListResponseDto);

    const groupArray = result.items;

    const minimalResult = groupArray.map((dto) => ({
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

  it('should return empty paginated response if no groups', async () => {
    repo.findAllPaginated.mockResolvedValue([[], 0]);
    const result = await useCase.execute();
    expect(result).toBeInstanceOf(GroupVmListResponseDto);
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
