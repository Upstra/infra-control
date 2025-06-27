import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEvent } from '../../domain/entities/history-event.entity';

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
