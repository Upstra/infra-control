import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { HistoryEvent } from '../entities/history-event.entity';
import { HistoryListFilters } from './history-filter.interface';

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
    filters?: HistoryListFilters,
  ): Promise<[HistoryEvent[], number]>;
  findDistinctEntityTypes(): Promise<string[]>;
}
