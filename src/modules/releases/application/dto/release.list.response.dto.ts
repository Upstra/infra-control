import { PaginatedResponseDto } from '@/core/dto';
import { ReleaseResponseDto } from './release.response.dto';

export class ReleaseListResponseDto extends PaginatedResponseDto<ReleaseResponseDto> {
  constructor(items: ReleaseResponseDto[], total: number, page: number, limit: number) {
    super(items, total, page, limit);
  }
}
