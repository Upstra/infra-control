import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryStatsResponseDto } from '../dto/history-stats-response.dto';

@Injectable()
export class GetHistoryStatisticsUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly historyRepository: HistoryRepositoryInterface,
  ) {}

  async execute(): Promise<HistoryStatsResponseDto> {
    const stats = await this.historyRepository.getStats();

    return {
      totalEvents: stats.totalEvents,
      eventsByEntity: stats.eventsByEntity,
      eventsByAction: stats.eventsByAction,
      activityTrends: stats.activityTrends,
      topUsers: stats.topUsers,
    };
  }
}
