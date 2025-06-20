import { Injectable, Inject } from '@nestjs/common';
import { StatisticsPort } from '../ports/statistics.port';

@Injectable()
export class GetSetupStatisticsUseCase {
  /**
   * Create the use case relying on a statistics provider.
   *
   * @param statisticsPort - Adapter supplying setup statistics
   */
  constructor(
    @Inject('StatisticsPort')
    private readonly statisticsPort: StatisticsPort,
  ) {}

  /**
   * Return setup statistics from the configured adapter.
   */
  async execute() {
    return this.statisticsPort.getStatistics();
  }
}
