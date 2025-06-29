import { LogHistoryUseCase } from '../log-history.use-case';
import { HistoryRepositoryInterface } from '@/modules/history/domain/interfaces/history.repository.interface';

describe('LogHistoryUseCase', () => {
  let repo: jest.Mocked<HistoryRepositoryInterface>;
  let useCase: LogHistoryUseCase;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
    } as any;
    useCase = new LogHistoryUseCase(repo);
  });

  it('saves event with provided data', async () => {
    await useCase.execute('user', 'id1', 'CREATE', 'userId');
    expect(repo.save).toHaveBeenCalled();
    const event = repo.save.mock.calls[0][0];
    expect(event.entity).toBe('user');
    expect(event.entityId).toBe('id1');
    expect(event.action).toBe('CREATE');
    expect(event.userId).toBe('userId');
  });

  it('saves event without optional userId', async () => {
    await useCase.execute('user', 'id1', 'CREATE');
    const event = repo.save.mock.calls[0][0];
    expect(event.userId).toBeUndefined();
  });
});
