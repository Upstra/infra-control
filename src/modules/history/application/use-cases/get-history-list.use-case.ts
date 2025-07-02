import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { HistoryEventResponseDto } from '../dto/history-event.response.dto';
import { HistoryListResponseDto } from '../dto/history.list.response.dto';
import { HistoryListFilters } from '../../domain/interfaces/history-filter.interface';

/**
 * Retrieves a paginated chronological list of history entries for audit and reporting.
 *
 * Responsibilities:
 * - Fetches history records with pagination support and optional filtering.
 * - Maps domain history entities to HistoryEventResponseDto for presentation.
 * - Returns paginated response with items, total count, and pagination metadata.
 *
 * @param page     number - Page number for pagination (defaults to 1).
 * @param limit    number - Number of items per page (defaults to 10).
 * @param filters  HistoryListFilters - Optional criteria (e.g. entity, action, userId, date range).
 * @returns        Promise<HistoryListResponseDto> containing paginated history entries and metadata.
 *
 * @remarks
 * Used by controllers or dashboard components to display recent events;
 * does not modify state. Includes user relations for complete event details.
 *
 * @example
 * const entries = await getHistoryListUseCase.execute(1, 20, { entity: 'server', action: 'create' });
 * const recentEvents = await getHistoryListUseCase.execute(); // Uses defaults: page=1, limit=10
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
