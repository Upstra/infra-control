import { DeleteGroupVmUseCase } from '../delete-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';

describe('DeleteGroupVmUseCase', () => {
  let useCase: DeleteGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;

  beforeEach(() => {
    repo = {
      deleteGroup: jest.fn(),
      findGroupById: jest.fn(),
    } as any;
    useCase = new DeleteGroupVmUseCase(repo);
  });

  it('should delete group by id', async () => {
    repo.deleteGroup.mockResolvedValue(undefined);
    await expect(useCase.execute('group-1')).resolves.toBeUndefined();
    expect(repo.deleteGroup).toHaveBeenCalledWith('group-1');
  });

  it('should propagate error if repo throws', async () => {
    repo.deleteGroup.mockRejectedValue(new Error('not found'));
    await expect(useCase.execute('group-404')).rejects.toThrow('not found');
  });
});
