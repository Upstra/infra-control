import { Injectable, Inject } from '@nestjs/common';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';

/**
 * Creates a new virtual machine group from the provided DTO.
 *
 * Orchestrates:
 * 1. Domain-level validation and entity instantiation.
 * 2. Persistence of the new group.
 *
 * @param groupDto  DTO containing name and priority for the VM group.
 * @returns {Promise<GroupVmDto>}
 *   The DTO of the persisted VM group.
 *
 * @example
 * const newVmGroup = await createGroupVmUseCase.execute({ name: 'Batch Nodes', priority: 2 });
 */

@Injectable()
export class CreateGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
    private readonly domain: GroupVmDomainService,
  ) {}

  async execute(groupDto: GroupVmDto): Promise<GroupVmDto> {
    const entity = this.domain.createGroup(groupDto);
    const created = await this.groupRepository.save(entity);

    return new GroupVmDto(created);
  }
}
