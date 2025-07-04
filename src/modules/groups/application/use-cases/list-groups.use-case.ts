import { Injectable } from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupQueryDto } from '../dto/group-query.dto';
import {
  PaginatedGroupResponseDto,
  PaginationMetaDto,
} from '../dto/paginated-group-response.dto';
import { GroupWithCounts } from '../../domain/interfaces/group.repository.interface';
import { GroupType } from '../../domain/enums/group-type.enum';

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
      data: result.data.map((group) => this.mapToResponseDto(group)),
      meta,
    };
  }

  private mapToResponseDto(group: GroupWithCounts): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      serverCount:
        group.type === GroupType.SERVER ? group.serverCount : undefined,
      vmCount: group.type === GroupType.VM ? group.vmCount : undefined,
    };
  }
}
