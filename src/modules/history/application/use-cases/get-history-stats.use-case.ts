import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

@Injectable()
export class GetHistoryStatsUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(entity: string, months: number): Promise<Record<string, number>> {
    return this.repo.countCreatedByMonth(entity, months);
  }
}
