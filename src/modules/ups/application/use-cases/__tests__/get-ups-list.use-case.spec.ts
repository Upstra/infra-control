import { GetUpsListUseCase } from '../get-ups-list.use-case';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';

describe('GetUpsListUseCase', () => {
  let useCase: GetUpsListUseCase;
  let repo: jest.Mocked<UpsRepositoryInterface>;

  beforeEach(() => {
    repo = {
      paginate: jest.fn(),
    } as any;
    useCase = new GetUpsListUseCase(repo);
  });

  it('should return paginated UPS list', async () => {
    const upsList = [createMockUps({ id: 'ups-1' })];
    repo.paginate.mockResolvedValue([upsList, 1]);

    const result = await useCase.execute(2, 5);

    expect(repo.paginate).toHaveBeenCalledWith(2, 5);
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(2);
  });

  it('should return empty list when no UPS found', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
