import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';

/**
 * Fetches a specific VM group by ID, including its member VMs.
 *
 * @param id  The UUID of the VM group.
 * @returns {Promise<GroupVmDto>}
 *   DTO representing the group and its VM entities.
 *
 * @throws {NotFoundException} if the group is not found.
 *
 * @example
 * const vmGroup = await getGroupVmByIdUseCase.execute('...uuid...');
 */

@Injectable()
export class GetGroupVmByIdUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupVmDto> {
    const group = await this.groupRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['vms'],
    });

    return new GroupVmDto(group);
  }
}
