import { GetGroupServerByIdUseCase } from '../get-group-server-by-id.use-case';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetGroupServerByIdUseCase', () => {
  let useCase: GetGroupServerByIdUseCase;
  let groupRepository: jest.Mocked<GroupServerRepositoryInterface>;

  beforeEach(() => {
    groupRepository = {
      findOneByField: jest.fn(),
    } as any;
    useCase = new GetGroupServerByIdUseCase(groupRepository);
  });

  it('should return DTO if group is found', async () => {
    const group = createMockGroupServer({
      name: 'Group X',
      priority: 5,
      servers: [createMockServer({ id: 'server-aaa' })],
    });

    groupRepository.findOneByField.mockResolvedValue(group);

    const res = await useCase.execute('group-id-123');
    expect(res).toEqual({
      name: 'Group X',
      priority: 5,
      serverIds: ['server-aaa'],
    });
    expect(groupRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'group-id-123',
      relations: ['servers'],
    });
  });

  it('should throw GroupNotFoundException if group does not exist', async () => {
    groupRepository.findOneByField.mockImplementation(() => {
      throw new GroupNotFoundException('server', 'notfound-id');
    });

    await expect(useCase.execute('notfound-id')).rejects.toThrow(
      GroupNotFoundException,
    );
    expect(groupRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'notfound-id',
      relations: ['servers'],
    });
  });

  it('should handle group with no servers', async () => {
    const group = createMockGroupServer({ servers: [] });

    groupRepository.findOneByField.mockResolvedValue(group);

    const res = await useCase.execute('group-empty');
    expect(res).toEqual({
      name: group.name,
      priority: group.priority,
      serverIds: [],
    });
  });

  it('should handle group with multiple servers', async () => {
    const group = createMockGroupServer({
      name: 'Group Y',
      priority: 10,
      servers: [
        createMockServer({ id: 'srv-1' }),
        createMockServer({ id: 'srv-2' }),
        createMockServer({ id: 'srv-3' }),
      ],
    });

    groupRepository.findOneByField.mockResolvedValue(group);

    const res = await useCase.execute('group-y-id');
    expect(res).toEqual({
      name: 'Group Y',
      priority: 10,
      serverIds: ['srv-1', 'srv-2', 'srv-3'],
    });
  });
});
