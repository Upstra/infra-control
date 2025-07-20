import { GetServerByIdUseCase } from '../get-server-by-id.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.exception';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetServerByIdUseCase', () => {
  let useCase: GetServerByIdUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findServerById: jest.fn(),
      findServerByIdWithCredentials: jest.fn(),
    } as any;

    useCase = new GetServerByIdUseCase(repo);
  });

  it('should return a ServerResponseDto if server is found', async () => {
    const mockServer = createMockServer();
    repo.findServerByIdWithCredentials.mockResolvedValue(mockServer);

    const result = await useCase.execute('server-1');

    expect(result).toBeDefined();
    expect(result.id).toBe('server-1');
    expect(result.name).toBe(mockServer.name);
    expect(repo.findServerByIdWithCredentials).toHaveBeenCalledWith('server-1');
  });

  it('should throw ServerNotFoundException if server does not exist', async () => {
    repo.findServerByIdWithCredentials.mockResolvedValue(null);

    await expect(useCase.execute('not-found-id')).rejects.toThrow(
      ServerNotFoundException,
    );
    expect(repo.findServerByIdWithCredentials).toHaveBeenCalledWith(
      'not-found-id',
    );
  });
});
