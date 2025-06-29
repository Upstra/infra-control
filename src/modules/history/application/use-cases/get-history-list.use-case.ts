import { Inject, Injectable } from '@nestjs/common';
import {
  HistoryQuery,
  HistoryRepositoryInterface,
} from '../../domain/interfaces/history.repository.interface';
import { HistoryEventResponseDto } from '../dto/history-event.response.dto';
import { HistoryListResponseDto } from '../dto/history.list.response.dto';

@Injectable()
export class GetHistoryListUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(
    page = 1,
    limit = 10,
    query: HistoryQuery = {},
  ): Promise<HistoryListResponseDto> {
    const [events, total] = await this.repo.paginate(page, limit, ['user'], query);
    const dtos = events.map((e) => new HistoryEventResponseDto(e));
    return new HistoryListResponseDto(dtos, total, page, limit);
  }
}
