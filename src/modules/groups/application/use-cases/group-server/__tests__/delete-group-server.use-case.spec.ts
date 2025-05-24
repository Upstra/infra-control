import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { DeleteGroupServerUseCase } from '../delete-group-server.use-case';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

describe('DeleteGroupServerUseCase', () => {
  let useCase: DeleteGroupServerUseCase;
  let groupRepository: jest.Mocked<GroupServerTypeormRepository>;

  beforeEach(() => {
    groupRepository = {
      deleteGroup: jest.fn(),
    } as any;
    useCase = new DeleteGroupServerUseCase(groupRepository);
  });

  it('should delete a group by id', async () => {
    (groupRepository.deleteGroup as jest.Mock).mockResolvedValue(undefined);
    await expect(useCase.execute('group-id')).resolves.toBeUndefined();
    expect(groupRepository.deleteGroup).toHaveBeenCalledWith('group-id');
  });

  it('should throw if group not found', async () => {
    (groupRepository.deleteGroup as jest.Mock).mockRejectedValue(
      new GroupNotFoundException('server', 'group-id'),
    );
    await expect(useCase.execute('group-id')).rejects.toThrow(
      GroupNotFoundException,
    );
  });
});
