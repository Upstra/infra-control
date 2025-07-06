import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

@Injectable()
export class GetHistoryStatsUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly historyRepository: HistoryRepositoryInterface,
  ) {}

  async execute(
    entity: string,
    months: number,
  ): Promise<Record<string, number>> {
    return this.historyRepository.countCreatedByMonth(entity, months);
  }
}
