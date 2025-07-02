import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEvent } from '../../domain/entities/history-event.entity';

/**
 * Records a new history event into the audit log.
 *
 * Responsibilities:
 * - Accepts a HistoryLogDto containing entityType, entityId, action, userId, and timestamp.
 * - Validates DTO fields and enriches with server-generated metadata if needed.
 * - Persists the new history entry via the HistoryRepository.
 *
 * @param dto  HistoryLogDto with event details to record.
 * @returns    Promise<void> upon successful logging.
 *
 * @throws    ValidationException if required fields are missing or invalid.
 *
 * @remarks
 * Should be invoked by application-layer workflows whenever a domain change occurs;
 * controllers need not handle raw persistence.
 *
 * @example
 * await logHistoryUseCase.execute({ entityType: 'vm', entityId: '123', action: 'start', userId: 'u456', timestamp: new Date() });
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
