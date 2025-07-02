import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

/**
 * Computes aggregate metrics over history records for insight dashboards.
 *
 * Responsibilities:
 * - Counts creation events for a specific entity type over the last N months.
 * - Returns monthly aggregation data for charting or summary widgets.
 * - Provides historical trends for dashboard visualization.
 *
 * @param entity  string - The entity type to aggregate statistics for (e.g., 'vm', 'server', 'user').
 * @param months  number - The number of months to look back for aggregation.
 * @returns       Promise<Record<string, number>> containing monthly counts keyed by month.
 *
 * @remarks
 * Ideal for feeding dashboard panels that show creation trends over time;
 * does not persist or alter history data.
 *
 * @example
 * const stats = await getHistoryStatsUseCase.execute('vm', 6);
 * // Returns: { '2024-07': 15, '2024-08': 23, '2024-09': 18, ... }
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
