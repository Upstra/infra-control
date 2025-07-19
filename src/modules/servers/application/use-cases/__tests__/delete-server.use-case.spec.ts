import { DeleteServerUseCase } from '../delete-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.exception';

describe('DeleteServerUseCase', () => {
  let useCase: DeleteServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;

  beforeEach(() => {
    repo = {
      deleteServer: jest.fn(),
    } as any;

    useCase = new DeleteServerUseCase(repo);
  });

  it('should call repository delete with valid id', async () => {
    repo.deleteServer.mockResolvedValue(undefined);

    await expect(useCase.execute('server-id')).resolves.toBeUndefined();

    expect(repo.deleteServer).toHaveBeenCalledWith('server-id');
  });

  it('should throw if repository deletion fails', async () => {
    repo.deleteServer.mockRejectedValue(
      new ServerNotFoundException('server-id'),
    );

    await expect(useCase.execute('server-id')).rejects.toThrow(
      ServerNotFoundException,
    );

    expect(repo.deleteServer).toHaveBeenCalledWith('server-id');
  });
});
