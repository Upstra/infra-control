import { DeleteServerUseCase } from '../delete-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { DeleteIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.exception';

describe('DeleteServerUseCase', () => {
  let useCase: DeleteServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let deleteIloUsecase: jest.Mocked<DeleteIloUseCase>;

  beforeEach(() => {
    repo = {
      deleteServer: jest.fn(),
    } as any;

    deleteIloUsecase = {
      execute: jest.fn(),
    } as any;

    useCase = new DeleteServerUseCase(repo, deleteIloUsecase);
  });

  it('should call repository and ilo deletion with valid id', async () => {
    repo.deleteServer.mockResolvedValue(undefined);
    deleteIloUsecase.execute.mockResolvedValue(undefined);

    await expect(useCase.execute('server-id')).resolves.toBeUndefined();

    expect(repo.deleteServer).toHaveBeenCalledWith('server-id');
    expect(deleteIloUsecase.execute).toHaveBeenCalledWith('server-id');
  });

  it('should throw if repository deletion fails', async () => {
    repo.deleteServer.mockRejectedValue(
      new ServerNotFoundException('server-id'),
    );

    await expect(useCase.execute('server-id')).rejects.toThrow(
      ServerNotFoundException,
    );

    expect(repo.deleteServer).toHaveBeenCalledWith('server-id');
    expect(deleteIloUsecase.execute).not.toHaveBeenCalled();
  });
});
