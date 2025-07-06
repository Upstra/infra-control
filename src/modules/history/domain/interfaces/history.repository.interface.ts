import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { HistoryEvent } from '../entities/history-event.entity';
import { HistoryListFilters } from './history-filter.interface';

export interface HistoryStatsData {
  totalEvents: number;
  eventsByEntity: Record<string, number>;
  eventsByAction: Record<string, number>;
  activityTrends: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: string; username: string; count: number }>;
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
    filters?: HistoryListFilters,
  ): Promise<[HistoryEvent[], number]>;
  findDistinctEntityTypes(): Promise<string[]>;
  getStats(): Promise<HistoryStatsData>;
}
