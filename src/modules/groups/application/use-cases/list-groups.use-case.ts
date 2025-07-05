import { Injectable } from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { GroupQueryDto } from '../dto/group-query.dto';
import {
  PaginatedGroupResponseDto,
  PaginationMetaDto,
} from '../dto/paginated-group-response.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class ListGroupsUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(query: GroupQueryDto): Promise<PaginatedGroupResponseDto> {
    const { page = 1, limit = 10, type, search } = query;

    const result = await this.groupRepository.findAllPaginatedWithCounts({
      page,
      limit,
      type,
      search,
    });

    const meta: PaginationMetaDto = {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPreviousPage: result.page > 1,
    };

    return {
      data: result.data.map((group) =>
        GroupMapper.toResponseDtoWithCounts(group),
      ),
      meta,
    };
  }
}
