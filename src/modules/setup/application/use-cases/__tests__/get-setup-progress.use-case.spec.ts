import { GetSetupProgressUseCase } from '../get-setup-progress.use-case';

describe('GetSetupProgressUseCase', () => {
  let useCase: GetSetupProgressUseCase;
  const repo = { findAll: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetSetupProgressUseCase(repo);
  });

  it('returns progress list from repository', async () => {
    const data = [{ step: 'welcome' }];
    repo.findAll.mockResolvedValue(data);
    const result = await useCase.execute();
    expect(result).toBe(data);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when repository has none', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });

  it('propagates errors from repository', async () => {
    repo.findAll.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute()).rejects.toThrow('fail');
  });
});
