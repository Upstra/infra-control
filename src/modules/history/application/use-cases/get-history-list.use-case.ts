import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEventResponseDto } from '../dto/history-event.response.dto';
import { HistoryListResponseDto } from '../dto/history.list.response.dto';
import { HistoryListFilters } from '../../domain/interfaces/history-filter.interface';

/**
 * Retrieves a chronological list of history entries for audit and reporting.
 *
 * Responsibilities:
 * - Fetches all history records optionally filtered by entity type or date range.
 * - Maps domain history entities to HistoryEntryDto for presentation.
 * - Supports pagination or sorting if parameters are provided.
 *
 * @param filters?  Optional criteria (e.g. entityType, startDate, endDate).
 * @returns         Promise<HistoryEntryDto[]> array of history entries ordered by timestamp.
 *
 * @remarks
 * Used by controllers or dashboard components to display recent events;
 * does not modify state.
 *
 * @example
 * const entries = await getHistoryListUseCase.execute({ entityType: 'server', startDate: '2025-06-01' });
 */

@Injectable()
export class GetHistoryListUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(
    page = 1,
    limit = 10,
    filters: HistoryListFilters = {},
  ): Promise<HistoryListResponseDto> {
    const [events, total] = await this.repo.paginate(
      page,
      limit,
      ['user'],
      filters,
    );
    const dtos = events.map((e) => new HistoryEventResponseDto(e));
    return new HistoryListResponseDto(dtos, total, page, limit);
  }
}
