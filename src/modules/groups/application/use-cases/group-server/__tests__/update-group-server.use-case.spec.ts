import { UpdateGroupServerUseCase } from '../update-group-server.use-case';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { GroupServerDto } from '../../../dto/group.server.dto';

describe('UpdateGroupServerUseCase', () => {
  let useCase: UpdateGroupServerUseCase;
  let groupRepository: jest.Mocked<GroupServerRepositoryInterface>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let domain: jest.Mocked<GroupServerDomainService>;

  beforeEach(() => {
    groupRepository = {
      findGroupById: jest.fn(),
      save: jest.fn(),
    } as any;

    serverRepository = {
      findAllByField: jest.fn(),
    } as any;

    domain = {
      updateGroupEntityFromDto: jest.fn(),
    } as any;

    useCase = new UpdateGroupServerUseCase(
      groupRepository,
      serverRepository,
      domain,
    );
  });

  it('should update group with new name and servers', async () => {
    const group = createMockGroupServer({
      id: 'group-123',
      name: 'Old Name',
      servers: [createMockServer({ id: 'server-1' })],
    });
    const newServers = [
      createMockServer({ id: 'server-2' }),
      createMockServer({ id: 'server-3' }),
    ];
    const dto = new GroupServerDto(group);
    dto.name = 'New Name';
    dto.serverIds = ['server-2', 'server-3'];

    groupRepository.findGroupById.mockResolvedValue(group);
    serverRepository.findAllByField.mockResolvedValue(newServers);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      entity.name = dto.name;
      return entity;
    });
    groupRepository.save.mockImplementation(async (entity) => entity);

    const res = await useCase.execute('group-123', dto);

    expect(groupRepository.findGroupById).toHaveBeenCalledWith('group-123');
    expect(serverRepository.findAllByField).toHaveBeenCalledWith({
      field: 'id',
      value: ['server-2', 'server-3'],
      relations: ['group'],
    });
    expect(domain.updateGroupEntityFromDto).toHaveBeenCalledWith(group, dto);

    expect(res).toEqual(new GroupServerDto(group));
  });

  it('should update group without changing servers if serverIds is not provided', async () => {
    const group = createMockGroupServer({
      id: 'group-456',
      name: 'Old Name',
      servers: [createMockServer({ id: 'server-1' })],
    });
    const dto = new GroupServerDto(group);
    dto.name = 'Still Old Name';
    dto.serverIds = undefined;

    groupRepository.findGroupById.mockResolvedValue(group);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      entity.name = dto.name;
      return entity;
    });
    groupRepository.save.mockImplementation(async (entity) => entity);

    const res = await useCase.execute('group-456', dto);

    expect(serverRepository.findAllByField).not.toHaveBeenCalled();
    expect(res).toEqual(new GroupServerDto(group));
  });

  it('should throw GroupNotFoundException if group does not exist', async () => {
    groupRepository.findGroupById.mockResolvedValue(null);
    const dto = new GroupServerDto({} as any);
    await expect(useCase.execute('notfound-id', dto)).rejects.toThrow(
      GroupNotFoundException,
    );
  });

  it('should handle empty serverIds (remove all servers)', async () => {
    const group = createMockGroupServer({
      id: 'group-789',
      name: 'Name',
      servers: [createMockServer({ id: 'server-1' })],
    });
    const dto = new GroupServerDto(group);
    dto.serverIds = [];

    groupRepository.findGroupById.mockResolvedValue(group);
    serverRepository.findAllByField.mockResolvedValue([]);
    domain.updateGroupEntityFromDto.mockImplementation((entity) => entity);
    groupRepository.save.mockImplementation(async (entity) => entity);

    const res = await useCase.execute('group-789', dto);

    expect(serverRepository.findAllByField).toHaveBeenCalledWith({
      field: 'id',
      value: [],
      relations: ['group'],
    });
    expect(res).toEqual(new GroupServerDto(group));
  });
});
