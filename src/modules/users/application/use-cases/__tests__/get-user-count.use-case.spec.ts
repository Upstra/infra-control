import { GetUserCountUseCase } from '../get-user-count.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

describe('GetUserCountUseCase', () => {
  let useCase: GetUserCountUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    repo = {
      count: jest.fn(),
    } as any;

    useCase = new GetUserCountUseCase(repo);
  });

  it('should return the number of users', async () => {
    repo.count.mockResolvedValue(42);

    const result = await useCase.execute();

    expect(repo.count).toHaveBeenCalled();
    expect(result).toBe(42);
  });

  it('should return 0 if no users are present', async () => {
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toBe(0);
  });

  it('should throw if repository throws', async () => {
    repo.count.mockRejectedValue(new Error('DB down'));

    await expect(useCase.execute()).rejects.toThrow('DB down');
  });
});
