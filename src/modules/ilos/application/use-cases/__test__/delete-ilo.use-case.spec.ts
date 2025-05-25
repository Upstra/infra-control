import { DeleteIloUseCase } from '../delete-ilo.use-case';

describe('DeleteIloUseCase', () => {
  let useCase: DeleteIloUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { deleteIlo: jest.fn() };
    useCase = new DeleteIloUseCase(repo);
  });

  it('should delete ilo by id', async () => {
    repo.deleteIlo.mockResolvedValue(undefined);
    await expect(useCase.execute('ilo-id')).resolves.toBeUndefined();
    expect(repo.deleteIlo).toHaveBeenCalledWith('ilo-id');
  });

  it('should throw if repository.deleteIlo fails', async () => {
    repo.deleteIlo.mockRejectedValue(new Error('DB Error'));
    await expect(useCase.execute('ilo-id')).rejects.toThrow('DB Error');
  });
});
