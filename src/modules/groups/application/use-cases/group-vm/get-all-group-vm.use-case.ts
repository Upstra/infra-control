import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmResponseDto } from '../../dto/group.vm.response.dto';
import { GroupVmListResponseDto } from '../../dto/group.vm.list.response.dto';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';

/**
 * Retrieves all VM groups with their VM listings.
 *
 * Delegates to the VM repository, then converts each GroupVm entity
 * into its DTO equivalent for client consumption.
 *
 * @returns {Promise<GroupVmListResponseDto>}
 *   A paginated response containing VM group DTOs and pagination metadata.
 *
 * @remarks
 * Read-only operation without extra domain logic.
 *
 * @example
 * const vmGroups = await getAllGroupVmUseCase.execute();
 */

@Injectable()
export class GetAllGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(page = 1, limit = 10): Promise<GroupVmListResponseDto> {
    const [groups, total] = await this.groupRepository.findAllPaginated(
      page,
      limit,
    );
    const items = groups.map((g: GroupVm) => new GroupVmResponseDto(g));
    return new GroupVmListResponseDto(items, total, page, limit);
  }
}
