import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { HistoryEvent } from '../entities/history-event.entity';

export interface HistoryQuery {
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export interface HistoryRepositoryInterface
  extends GenericRepositoryInterface<HistoryEvent> {
  countCreatedByMonth(
    entity: string,
    months: number,
  ): Promise<Record<string, number>>;
  paginate(
    page: number,
    limit: number,
    relations?: string[],
    query?: HistoryQuery,
  ): Promise<[HistoryEvent[], number]>;
}
