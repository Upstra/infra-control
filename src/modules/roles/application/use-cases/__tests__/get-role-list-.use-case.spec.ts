import { GetRoleListUseCase } from '../get-role-list.use-case';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('GetRoleListUseCase', () => {
  let useCase: GetRoleListUseCase;
  let repo: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    repo = { paginate: jest.fn() } as any;
    useCase = new GetRoleListUseCase(repo);
  });

  it('should return paginated roles', async () => {
    const roles = [createMockRole({ id: '1' }), createMockRole({ id: '2' })];
    repo.paginate.mockResolvedValue([roles, 2]);

    const result = await useCase.execute(1, 10);

    expect(repo.paginate).toHaveBeenCalledWith(1, 10);
    expect(result.totalItems).toBe(2);
    expect(result.items[0].id).toBe('1');
    expect(result.totalPages).toBe(1);
  });

  it('should use default values when none are provided', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();

    expect(repo.paginate).toHaveBeenCalledWith(1, 10);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('should compute total pages correctly', async () => {
    const roles = [createMockRole({ id: '1' }), createMockRole({ id: '2' })];
    repo.paginate.mockResolvedValue([roles, 3]);

    const result = await useCase.execute(1, 2);

    expect(repo.paginate).toHaveBeenCalledWith(1, 2);
    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(1);
  });

  it('should propagate errors', async () => {
    repo.paginate.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute()).rejects.toThrow('fail');
  });
});
