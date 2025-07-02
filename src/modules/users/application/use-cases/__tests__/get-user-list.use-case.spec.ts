import { GetUserListUseCase } from '../get-user-list.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('GetUserListUseCase', () => {
  let useCase: GetUserListUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    repo = { paginate: jest.fn() } as any;
    useCase = new GetUserListUseCase(repo);
  });

  it('should return paginated users', async () => {
    const users = [createMockUser({ id: '1' }), createMockUser({ id: '2' })];
    repo.paginate.mockResolvedValue([users, 2]);

    const result = await useCase.execute(1, 10);

    expect(repo.paginate).toHaveBeenCalledWith(1, 10, ['roles']);
    expect(result.totalItems).toBe(2);
    expect(result.items[0].id).toBe('1');
    expect(result.totalPages).toBe(1);
  });

  it('should use default values when none are provided', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();

    expect(repo.paginate).toHaveBeenCalledWith(1, 10, ['roles']);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('should compute total pages correctly', async () => {
    const users = [createMockUser({ id: '1' }), createMockUser({ id: '2' })];
    repo.paginate.mockResolvedValue([users, 3]);

    const result = await useCase.execute(1, 2);

    expect(repo.paginate).toHaveBeenCalledWith(1, 2, ['roles']);
    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(1);
  });

  it('should propagate errors', async () => {
    repo.paginate.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute()).rejects.toThrow('fail');
  });
});
