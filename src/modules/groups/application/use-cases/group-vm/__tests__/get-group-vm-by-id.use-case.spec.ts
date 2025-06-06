import { GetGroupVmByIdUseCase } from '../get-group-vm-by-id.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';
import { GroupVmDto } from '../../../dto/group.vm.dto';
describe('GetGroupVmByIdUseCase', () => {
  let useCase: GetGroupVmByIdUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
    } as any;
    useCase = new GetGroupVmByIdUseCase(repo);
  });

  it('should return DTO if group is found', async () => {
    const group = createMockGroupVm({ id: 'groupvm-2', name: 'GroupX' });
    repo.findOneByField.mockResolvedValue(group);

    const result = await useCase.execute('groupvm-2');

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'groupvm-2',
      relations: ['vms'],
    });
    expect(result).toEqual(new GroupVmDto(group));
  });

  it('should return DTO if group is not found', async () => {
    repo.findOneByField.mockResolvedValue(null as any);
    const result = await useCase.execute('notfound');
    expect(result).toEqual(new GroupVmDto({ vmIds: [] }));
  });
});
