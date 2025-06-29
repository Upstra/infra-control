import { GetHistoryListUseCase } from '../get-history-list.use-case';
import { HistoryRepositoryInterface } from '@/modules/history/domain/interfaces/history.repository.interface';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';

describe('GetHistoryListUseCase', () => {
  let useCase: GetHistoryListUseCase;
  let repo: jest.Mocked<HistoryRepositoryInterface>;

  beforeEach(() => {
    repo = {
      paginate: jest.fn(),
    } as any;
    useCase = new GetHistoryListUseCase(repo);
  });

  it('returns paginated history events', async () => {
    const events = [new HistoryEvent()];
    repo.paginate.mockResolvedValue([events, 1]);

    const result = await useCase.execute(2, 5, { action: 'CREATE' });

    expect(repo.paginate).toHaveBeenCalledWith(2, 5, ['user'], { action: 'CREATE' });
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(2);
  });

  it('returns empty list when no events', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();
    expect(repo.paginate).toHaveBeenCalledWith(1, 10, ['user'], {});
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
