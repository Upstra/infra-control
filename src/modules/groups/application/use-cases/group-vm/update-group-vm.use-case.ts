import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';

/**
 * Updates metadata and VM membership for an existing VM group.
 *
 * Process:
 * 1. Load existing group or throw GroupNotFoundException.
 * 2. Use domain service to apply DTO changes.
 * 3. Persist and return updated group DTO.
 *
 * @param id        The UUID of the VM group.
 * @param groupDto  DTO with updated name, priority, and optional VM list.
 * @returns {Promise<GroupVmDto>}
 *   The updated group DTO reflecting all changes.
 *
 * @throws {GroupNotFoundException} if the VM group does not exist.
 *
 * @example
 * const updatedVmGroup = await updateGroupVmUseCase.execute(groupId, { priority: 5 });
 */

@Injectable()
export class UpdateGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
    private readonly domain: GroupVmDomainService,
  ) {}

  async execute(id: string, groupDto: GroupVmDto): Promise<GroupVmDto> {
    const existing = await this.groupRepository.findGroupById(id);
    if (!existing) throw new GroupNotFoundException('vm', id);

    const entity = this.domain.updateGroupEntityFromDto(existing, groupDto);

    const updated = await this.groupRepository.save(entity);

    return new GroupVmDto(updated);
  }
}
