import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEvent } from '../../domain/entities/history-event.entity';

/**
 * Records a new history event into the audit log.
 *
 * Responsibilities:
 * - Accepts individual parameters for entity, entityId, action, and optional userId.
 * - Creates a HistoryEvent entity with the provided data and timestamp.
 * - Persists the new history entry via the HistoryRepository.
 *
 * @param entity    string - The type of entity being logged (e.g., 'vm', 'server', 'user').
 * @param entityId  string - The unique identifier of the entity.
 * @param action    string - The action performed on the entity (e.g., 'create', 'update', 'delete').
 * @param userId    string - Optional. The ID of the user who performed the action.
 * @returns         Promise<void> upon successful logging.
 *
 * @remarks
 * Should be invoked by application-layer workflows whenever a domain change occurs;
 * controllers need not handle raw persistence.
 *
 * @example
 * await logHistoryUseCase.execute('vm', '123', 'start', 'u456');
 * await logHistoryUseCase.execute('server', 'srv-789', 'restart');
 */

@Injectable()
export class LogHistoryUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(
    entity: string,
    entityId: string,
    action: string,
    userId?: string,
  ): Promise<void> {
    const event = new HistoryEvent();
    event.entity = entity;
    event.entityId = entityId;
    event.action = action;
    if (userId) {
      event.userId = userId;
    }
    await this.repo.save(event);
  }
}
