import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

@Injectable()
export class GetHistoryListUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(): Promise<string[]> {
    const entityTypes = await this.repo.findAll({
      select: ['entity'],
      distinct: true,
    });

    return entityTypes;
  }
}
