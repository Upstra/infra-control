import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEvent } from '../../domain/entities/history-event.entity';

export interface StructuredLogParams {
  entity: string;
  entityId: string;
  action: string;
  userId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

/**
 * Records a new history event into the audit log with structured data support.
 *
 * Responsibilities:
 * - Accepts individual parameters for entity, entityId, action, and optional userId.
 * - Supports structured logging with before/after values, metadata, and context.
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
 * await logHistoryUseCase.executeStructured({
 *   entity: 'user',
 *   entityId: 'u123',
 *   action: 'UPDATE',
 *   userId: 'u456',
 *   oldValue: { email: 'old@example.com' },
 *   newValue: { email: 'new@example.com' },
 *   metadata: { changedFields: ['email'] },
 *   ipAddress: '192.168.1.1'
 * });
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

  async executeStructured(params: StructuredLogParams): Promise<void> {
    const event = new HistoryEvent();
    event.entity = params.entity;
    event.entityId = params.entityId;
    event.action = params.action;

    if (params.userId) {
      event.userId = params.userId;
    }

    if (params.oldValue) {
      event.oldValue = params.oldValue;
    }

    if (params.newValue) {
      event.newValue = params.newValue;
    }

    if (params.metadata) {
      event.metadata = params.metadata;
    }

    if (params.ipAddress) {
      event.ipAddress = params.ipAddress;
    }

    if (params.userAgent) {
      event.userAgent = params.userAgent;
    }

    if (params.correlationId) {
      event.correlationId = params.correlationId;
    }

    await this.repo.save(event);
  }
}
