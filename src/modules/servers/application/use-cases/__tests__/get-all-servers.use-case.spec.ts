import { GetAllServersUseCase } from '../get-all-servers.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetAllServersUseCase', () => {
  let useCase: GetAllServersUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as any;

    useCase = new GetAllServersUseCase(repo);
  });

  it('should return an array of ServerResponseDto when servers are found', async () => {
    const mockServers = [
      createMockServer(),
      createMockServer({ id: 'server-2' }),
    ];
    repo.findAll.mockResolvedValue(mockServers);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('server-1');
    expect(result[1].id).toBe('server-2');
  });

  it('should return an empty array when no servers are found', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
