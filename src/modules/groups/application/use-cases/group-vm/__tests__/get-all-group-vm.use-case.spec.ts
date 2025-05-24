import { GetAllGroupVmUseCase } from '../get-all-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';
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
      createMockGroupVm({ id: 'groupvm-1', name: 'Group 1', priority: 2 }),
      createMockGroupVm({ id: 'groupvm-2', name: 'Group 2', priority: 5 }),
    ];
    repo.findAll.mockResolvedValue(mockGroups);

    const result = await useCase.execute();

    expect(repo.findAll).toHaveBeenCalled();
    expect(result).toEqual([
      new GroupVmDto(mockGroups[0]),
      new GroupVmDto(mockGroups[1]),
    ]);
  });

  it('should return empty array if no groups', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
