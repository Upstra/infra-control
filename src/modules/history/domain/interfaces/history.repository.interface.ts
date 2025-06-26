import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { HistoryEvent } from '../entities/history-event.entity';

export interface HistoryRepositoryInterface
  extends GenericRepositoryInterface<HistoryEvent> {
  countCreatedByMonth(entity: string, months: number): Promise<Record<string, number>>;
}
