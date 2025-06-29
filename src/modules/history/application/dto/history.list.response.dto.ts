import { PaginatedResponseDto } from '@/core/dto';
import { HistoryEventResponseDto } from './history-event.response.dto';

export class HistoryListResponseDto extends PaginatedResponseDto<HistoryEventResponseDto> {
  constructor(
    items: HistoryEventResponseDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    super(items, total, page, limit);
  }
}
