import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

/**
 * Computes aggregate metrics over history records for insight dashboards.
 *
 * Responsibilities:
 * - Counts events by type (creates, updates, deletes, state-changes).
 * - Aggregates totals over a configurable time window (e.g. last 24h, last 7 days).
 * - Returns structured statistics for charting or summary widgets.
 *
 * @param timeframe  Object specifying aggregation window (start and end timestamps).
 * @returns          Promise<HistoryStatsDto> containing counts per event category.
 *
 * @remarks
 * Ideal for feeding dashboard panels that show event volumes;
 * does not persist or alter history data.
 *
 * @example
 * const stats = await getHistoryStatsUseCase.execute({ start: '2025-06-20', end: '2025-06-27' });
 */

@Injectable()
export class GetHistoryStatsUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(
    entity: string,
    months: number,
  ): Promise<Record<string, number>> {
    return this.repo.countCreatedByMonth(entity, months);
  }
}
