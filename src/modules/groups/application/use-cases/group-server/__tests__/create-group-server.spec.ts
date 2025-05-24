import { CreateGroupServerUseCase } from '../create-group-server.use-case';
import { GroupRepositoryInterface } from '@/modules/groups/domain/interfaces/group.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';
import { GroupServerDto } from '@/modules/groups/application/dto/group.server.dto';
import { Server } from '@/modules/servers/domain/entities/server.entity';

describe('CreateGroupServerUseCase', () => {
  let useCase: CreateGroupServerUseCase;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let domain: GroupServerDomainService;

  beforeEach(() => {
    groupRepository = {
      save: jest.fn(),
    } as any;

    serverRepository = {
      findOneByField: jest.fn(),
    } as any;

    domain = {
      createGroup: jest.fn(),
    } as any;

    useCase = new CreateGroupServerUseCase(
      groupRepository,
      serverRepository,
      domain,
    );
  });

  it('should create a group with servers', async () => {
    const dto: GroupServerDto = {
      name: 'Serveur critique',
      priority: 1,
      serverIds: ['server-1', 'server-2'],
    };

    const groupEntity = {
      name: dto.name,
      priority: dto.priority,
      servers: [],
    };

    const savedGroup = {
      ...groupEntity,
      servers: [{ id: 'server-1' } as Server, { id: 'server-2' } as Server],
    };

    (domain.createGroup as jest.Mock).mockReturnValue(groupEntity);

    (serverRepository.findOneByField as jest.Mock)
      .mockResolvedValueOnce({ id: 'server-1' })
      .mockResolvedValueOnce({ id: 'server-2' });

    (groupRepository.save as jest.Mock).mockResolvedValue(savedGroup);

    const result = await useCase.execute(dto);

    expect(domain.createGroup).toHaveBeenCalledWith(dto);
    expect(serverRepository.findOneByField).toHaveBeenCalledTimes(2);
    expect(groupRepository.save).toHaveBeenCalledWith({
      ...groupEntity,
      servers: [{ id: 'server-1' }, { id: 'server-2' }],
    });
    expect(result).toEqual(savedGroup);
  });

  it('should throw if a server is not found', async () => {
    const dto: GroupServerDto = {
      name: 'Serveur critique',
      priority: 1,
      serverIds: ['server-1'],
    };
    const groupEntity = {
      name: dto.name,
      priority: dto.priority,
      servers: [],
    };

    (domain.createGroup as jest.Mock).mockReturnValue(groupEntity);

    (serverRepository.findOneByField as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Server not found: server-1',
    );
  });
});
