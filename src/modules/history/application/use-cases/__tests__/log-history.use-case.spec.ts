import {
  LogHistoryUseCase,
  StructuredLogParams,
} from '../log-history.use-case';
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

  describe('execute', () => {
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

  describe('executeStructured', () => {
    it('saves structured event with all fields', async () => {
      const params: StructuredLogParams = {
        entity: 'user',
        entityId: 'u123',
        action: 'UPDATE',
        userId: 'admin123',
        oldValue: { email: 'old@example.com', username: 'olduser' },
        newValue: { email: 'new@example.com', username: 'newuser' },
        metadata: {
          changedFields: ['email', 'username'],
          updateType: 'full_update',
        },
        ipAddress: '192.168.1.1',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        correlationId: 'corr-123',
      };

      await useCase.executeStructured(params);

      expect(repo.save).toHaveBeenCalled();
      const event = repo.save.mock.calls[0][0];
      expect(event.entity).toBe('user');
      expect(event.entityId).toBe('u123');
      expect(event.action).toBe('UPDATE');
      expect(event.userId).toBe('admin123');
      expect(event.oldValue).toEqual({
        email: 'old@example.com',
        username: 'olduser',
      });
      expect(event.newValue).toEqual({
        email: 'new@example.com',
        username: 'newuser',
      });
      expect(event.metadata).toEqual({
        changedFields: ['email', 'username'],
        updateType: 'full_update',
      });
      expect(event.ipAddress).toBe('192.168.1.1');
      expect(event.userAgent).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      );
      expect(event.correlationId).toBe('corr-123');
    });

    it('saves structured event with only required fields', async () => {
      const params: StructuredLogParams = {
        entity: 'server',
        entityId: 'srv456',
        action: 'START',
      };

      await useCase.executeStructured(params);

      expect(repo.save).toHaveBeenCalled();
      const event = repo.save.mock.calls[0][0];
      expect(event.entity).toBe('server');
      expect(event.entityId).toBe('srv456');
      expect(event.action).toBe('START');
      expect(event.userId).toBeUndefined();
      expect(event.oldValue).toBeUndefined();
      expect(event.newValue).toBeUndefined();
      expect(event.metadata).toBeUndefined();
      expect(event.ipAddress).toBeUndefined();
      expect(event.userAgent).toBeUndefined();
      expect(event.correlationId).toBeUndefined();
    });

    it('saves structured event with partial data', async () => {
      const params: StructuredLogParams = {
        entity: 'vm',
        entityId: 'vm789',
        action: 'DELETE',
        userId: 'user456',
        metadata: { reason: 'cleanup', automated: true },
        ipAddress: '10.0.0.1',
      };

      await useCase.executeStructured(params);

      expect(repo.save).toHaveBeenCalled();
      const event = repo.save.mock.calls[0][0];
      expect(event.entity).toBe('vm');
      expect(event.entityId).toBe('vm789');
      expect(event.action).toBe('DELETE');
      expect(event.userId).toBe('user456');
      expect(event.metadata).toEqual({ reason: 'cleanup', automated: true });
      expect(event.ipAddress).toBe('10.0.0.1');
      expect(event.oldValue).toBeUndefined();
      expect(event.newValue).toBeUndefined();
      expect(event.userAgent).toBeUndefined();
      expect(event.correlationId).toBeUndefined();
    });
  });
});
