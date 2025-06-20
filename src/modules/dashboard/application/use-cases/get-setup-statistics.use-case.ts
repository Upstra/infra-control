import { Injectable, Inject } from '@nestjs/common';
import { StatisticsPort } from '../ports/statistics.port';

@Injectable()
export class GetSetupStatisticsUseCase {
  constructor(
    @Inject('StatisticsPort')
    private readonly statisticsPort: StatisticsPort,
  ) {}

  async execute() {
    return this.statisticsPort.getStatistics();
  }
}
