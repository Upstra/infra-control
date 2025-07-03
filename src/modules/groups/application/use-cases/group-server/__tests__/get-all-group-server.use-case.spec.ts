import { GetAllGroupServerUseCase } from '../get-all-group-server.use-case';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { GroupServerResponseDto } from '@/modules/groups/application/dto/group.server.response.dto';

describe('GetAllGroupServerUseCase', () => {
  let useCase: GetAllGroupServerUseCase;
  let groupRepository: jest.Mocked<GroupServerTypeormRepository>;

  beforeEach(() => {
    groupRepository = {
      findAll: jest.fn(),
    } as any;
    useCase = new GetAllGroupServerUseCase(groupRepository);
  });

  it('should return all groups as DTOs', async () => {
    const groups = [
      createMockGroupServer({
        name: 'Group 1',
        priority: 1,
        servers: [
          createMockServer({ id: 'server-1' }),
          createMockServer({ id: 'server-2' }),
        ],
      }),
      createMockGroupServer({
        name: 'Group 2',
        priority: 2,
        servers: [createMockServer({ id: 'server-3' })],
      }),
    ];

    groupRepository.findAll.mockResolvedValue(groups);

    const res = await useCase.execute();

    expect(res).toEqual([
      new GroupServerResponseDto(groups[0]),
      new GroupServerResponseDto(groups[1]),
    ]);
  });
});
